# Performance Optimizations

## Problem

The app was freezing for 10+ seconds when processing large images (~2000x2000, 16MB of pixel data), even though the actual image processing in the Web Worker completed in ~30ms.

## Root Cause

**Passing large ImageData objects as React props.**

When ImageData was passed as a prop to components like `FrameThumbnail`:

```tsx
// SLOW - React does expensive operations on large props
<FrameThumbnail imageData={imageData} />
```

React performs operations on props during reconciliation:
- Comparing old vs new props to determine if re-render is needed
- Serializing for React DevTools
- Internal bookkeeping

For a 2000x2000 image, ImageData contains a 16MB `Uint8ClampedArray`. Even though JavaScript passes objects by reference, React still iterates/inspects these objects, causing massive slowdowns.

## Solution

**Never pass large objects as React props. Pass primitive IDs instead and fetch data inside effects.**

### Before (Slow)

```tsx
// Parent fetches ImageData and passes as prop
function SequencePlayer() {
  const imageData = getProcessedImageData(frame.id);
  return <FrameThumbnail imageData={imageData} />;
}

// Child receives ImageData as prop
function FrameThumbnail({ imageData }: { imageData: ImageData }) {
  useEffect(() => {
    ctx.putImageData(imageData, 0, 0);
  }, [imageData]);
}
```

### After (Fast)

```tsx
// Parent passes only primitive values
function SequencePlayer() {
  const processedVersion = useAppStore((s) => s.processedVersion);
  return <FrameThumbnail frameId={frame.id} version={processedVersion} />;
}

// Child fetches ImageData inside effect
const FrameThumbnail = memo(function FrameThumbnail({
  frameId,
  version
}: {
  frameId: string;
  version: number;
}) {
  const getProcessedImageData = useAppStore((s) => s.getProcessedImageData);

  useEffect(() => {
    const imageData = getProcessedImageData(frameId);
    if (imageData) {
      ctx.putImageData(imageData, 0, 0);
    }
  }, [frameId, version]);
});
```

## Architecture Pattern

### External Cache for Large Data

Store large objects outside of React/state management:

```tsx
// External cache - not managed by React or Zustand
const imageCache = {
  original: new Map<string, ImageData>(),
  processed: new Map<string, ImageData>(),
};

// Zustand store only holds references and metadata
const useAppStore = create((set, get) => ({
  frames: [], // Just { id, name, width, height } - no ImageData
  processedVersion: 0, // Increment to trigger re-renders

  getProcessedImageData: (id) => imageCache.processed.get(id),

  processCurrentFrame: async () => {
    const processed = await processImageAsync(...);
    imageCache.processed.set(frame.id, processed);
    // Bump version to notify subscribers
    set(state => ({ processedVersion: state.processedVersion + 1 }));
  },
}));
```

### Version Counter Pattern

Use a simple counter to signal when data has changed:

```tsx
// Subscribe to version changes
const processedVersion = useAppStore((s) => s.processedVersion);

// Re-run effect when version changes
useEffect(() => {
  const imageData = getProcessedImageData(frameId);
  // ... use imageData
}, [frameId, processedVersion]);
```

## Other Optimizations Applied

### 1. Web Worker for Processing

All image processing runs in a Web Worker to keep the main thread responsive:

```tsx
// workerProcessor.ts
export function processImageAsync(options): Promise<ImageData> {
  return new Promise((resolve) => {
    worker.postMessage(request, [buffer]); // Transfer buffer, don't copy
  });
}
```

### 2. Color Lookup Table (LUT)

Pre-computed 32x32x32 lookup table for O(1) nearest color matching instead of O(palette_size) per pixel:

```tsx
// O(1) lookup instead of iterating palette
const idx = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
const nearestColorIndex = lut.table[idx];
```

### 3. Zustand without Immer

Removed Immer middleware to avoid proxy overhead on large objects:

```tsx
// Before - Immer wraps everything in proxies
create(immer((set) => ({ ... })));

// After - Plain object spreads
create((set) => ({
  updateState: (data) => set(state => ({ ...state, ...data })),
}));
```

### 4. Memoized Components

Use `React.memo` for components that receive primitive props:

```tsx
const FrameThumbnail = memo(function FrameThumbnail({ frameId, version }) {
  // Only re-renders when frameId or version changes
});
```

## Key Takeaways

1. **Profile first** - The profiler showed 10s in `processCurrentFrame` but our timing showed 30ms. The gap was React's reconciliation.

2. **Large objects + React props = slow** - Even with reference equality, React inspects prop objects.

3. **External caches work** - Store large data outside React, use primitive IDs/versions to trigger updates.

4. **Web Workers help but aren't enough** - Moving processing off-thread is good, but you still need to handle the data correctly on the main thread.

## Results

- Before: 10+ second freeze on parameter change
- After: ~30ms processing, no UI freeze
