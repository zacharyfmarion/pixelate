import { useRef, useEffect, useState, useCallback } from 'react';
import { useAppStore } from '../store/appStore';

const ZOOM_LEVELS = [0.1, 0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4, 5];
const FIT_ZOOM = -1; // Special value for "fit to screen"

export function PreviewCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const [zoom, setZoom] = useState<number>(FIT_ZOOM);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const zoomRef = useRef(zoom);

  // Keep ref in sync with state for use in event handlers
  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  const frames = useAppStore((s) => s.frames);
  const currentFrameIndex = useAppStore((s) => s.currentFrameIndex);
  const isProcessing = useAppStore((s) => s.isProcessing);
  const getOriginalImageData = useAppStore((s) => s.getOriginalImageData);
  const getProcessedImageData = useAppStore((s) => s.getProcessedImageData);
  // Subscribe to processedVersion to re-render when images are processed
  const processedVersion = useAppStore((s) => s.processedVersion);

  const currentFrame = frames[currentFrameIndex];

  // Track container size
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setContainerSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Calculate the effective zoom level
  const getEffectiveZoom = useCallback(() => {
    if (!currentFrame) return 1;
    if (zoom !== FIT_ZOOM) return zoom;

    // Calculate fit zoom
    const padding = 32;
    const availableWidth = containerSize.width - padding;
    const availableHeight = containerSize.height - padding;

    if (availableWidth <= 0 || availableHeight <= 0) return 1;

    const scaleX = availableWidth / currentFrame.width;
    const scaleY = availableHeight / currentFrame.height;

    return Math.min(scaleX, scaleY, 1);
  }, [zoom, containerSize, currentFrame]);

  const effectiveZoom = getEffectiveZoom();

  // Draw the image - fetch ImageData inside the effect to avoid passing through React
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !currentFrame) return;

    // Get image data inside the effect, not during render
    const imageData = showOriginal
      ? getOriginalImageData(currentFrame.id)
      : getProcessedImageData(currentFrame.id) || getOriginalImageData(currentFrame.id);

    if (!imageData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Only resize canvas if dimensions changed
    if (canvas.width !== imageData.width || canvas.height !== imageData.height) {
      canvas.width = imageData.width;
      canvas.height = imageData.height;
    }

    ctx.putImageData(imageData, 0, 0);
  }, [currentFrame, showOriginal, processedVersion, getOriginalImageData, getProcessedImageData]);


  // Non-passive wheel event listener to properly prevent browser zoom
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || !currentFrame) return;

    const handleWheel = (e: WheelEvent) => {
      // Pinch-to-zoom sends wheel events with ctrlKey=true
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        e.stopPropagation();

        // Continuous zoom based on scroll delta
        const zoomFactor = 1 - e.deltaY * 0.002;

        setZoom((currentZoom) => {
          const currentEffective = currentZoom === FIT_ZOOM
            ? (() => {
                const padding = 32;
                const availableWidth = containerSize.width - padding;
                const availableHeight = containerSize.height - padding;
                if (availableWidth <= 0 || availableHeight <= 0) return 1;
                const scaleX = availableWidth / currentFrame.width;
                const scaleY = availableHeight / currentFrame.height;
                return Math.min(scaleX, scaleY, 1);
              })()
            : currentZoom;
          const newZoom = currentEffective * zoomFactor;
          return Math.max(0.05, Math.min(5, newZoom));
        });
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [containerSize, currentFrame]);

  const handleZoomIn = useCallback(() => {
    setZoom((currentZoom) => {
      if (currentZoom === FIT_ZOOM) {
        const currentEffective = getEffectiveZoom();
        const nextLevel = ZOOM_LEVELS.find((z) => z > currentEffective);
        return nextLevel || ZOOM_LEVELS[ZOOM_LEVELS.length - 1];
      } else {
        const currentIndex = ZOOM_LEVELS.indexOf(currentZoom);
        if (currentIndex < ZOOM_LEVELS.length - 1) {
          return ZOOM_LEVELS[currentIndex + 1];
        }
        return currentZoom;
      }
    });
  }, [getEffectiveZoom]);

  const handleZoomOut = useCallback(() => {
    setZoom((currentZoom) => {
      if (currentZoom === FIT_ZOOM) {
        const currentEffective = getEffectiveZoom();
        const prevLevels = ZOOM_LEVELS.filter((z) => z < currentEffective);
        return prevLevels.length > 0 ? prevLevels[prevLevels.length - 1] : ZOOM_LEVELS[0];
      } else {
        const currentIndex = ZOOM_LEVELS.indexOf(currentZoom);
        if (currentIndex > 0) {
          return ZOOM_LEVELS[currentIndex - 1];
        }
        return currentZoom;
      }
    });
  }, [getEffectiveZoom]);

  const handleFitToScreen = () => {
    setZoom(FIT_ZOOM);
  };

  const formatZoom = (z: number) => {
    return `${Math.round(z * 100)}%`;
  };

  if (!currentFrame) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0a0a12] border-2 border-[#3d3d5c]">
        <div className="text-[#5c5c8a] text-center">
          <div className="text-4xl mb-3">⬡</div>
          <p className="uppercase tracking-wider">Upload an image to get started</p>
        </div>
      </div>
    );
  }

  const displayWidth = currentFrame.width * effectiveZoom;
  const displayHeight = currentFrame.height * effectiveZoom;

  return (
    <div className="flex-1 flex flex-col bg-[#0a0a12] border-2 border-[#3d3d5c] overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-3 py-2 border-b-2 border-[#3d3d5c] bg-[#1a1a2e]">
        <div className="text-sm text-[#b8b4a9]">
          {currentFrame.name}
          <span className="text-[#5c5c8a] ml-2">
            {currentFrame.width} × {currentFrame.height}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isProcessing && (
            <span className="text-xs text-[#a89cc8] pixel-blink uppercase">Processing...</span>
          )}
          <button
            onClick={() => setShowOriginal(!showOriginal)}
            className={`text-xs px-3 py-1 border-2 transition-all uppercase tracking-wider ${
              showOriginal
                ? 'bg-[#5c4a8a] border-[#a89cc8] text-[#e8e4d9]'
                : 'bg-[#2d2d44] border-[#3d3d5c] text-[#b8b4a9] hover:bg-[#3d3d5c] hover:border-[#5c5c8a]'
            }`}
          >
            {showOriginal ? '◀ Original' : '▶ Processed'}
          </button>
        </div>
      </div>

      {/* Outer container for sizing */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden"
        style={{
          background:
            'repeating-conic-gradient(#12121a 0% 25%, #1a1a24 0% 50%) 50% / 16px 16px',
        }}
      >
        {/* Scroll container for panning */}
        <div
          ref={scrollContainerRef}
          className="w-full h-full overflow-auto"
        >
          <div
            className="flex items-center justify-center"
            style={{
              minWidth: '100%',
              minHeight: '100%',
              width: displayWidth > containerSize.width ? displayWidth + 32 : '100%',
              height: displayHeight > containerSize.height ? displayHeight + 32 : '100%',
              padding: 16,
            }}
          >
            <canvas
              ref={canvasRef}
              className="border-2 border-[#3d3d5c] shadow-[4px_4px_0_#0a0a12]"
              style={{
                width: displayWidth,
                height: displayHeight,
                imageRendering: 'pixelated',
                flexShrink: 0,
              }}
            />
          </div>
        </div>
      </div>

      {/* Zoom controls */}
      <div className="flex-shrink-0 flex items-center justify-center gap-2 px-3 py-2 border-t-2 border-[#3d3d5c] bg-[#1a1a2e]">
        <button
          onClick={handleZoomOut}
          className="px-2 py-1 border-2 border-[#3d3d5c] bg-[#2d2d44] hover:bg-[#3d3d5c] hover:border-[#5c5c8a] text-[#b8b4a9] transition-all"
          title="Zoom out"
        >
          −
        </button>

        <button
          onClick={handleFitToScreen}
          className={`px-3 py-1 text-xs border-2 transition-all min-w-[70px] uppercase tracking-wider ${
            zoom === FIT_ZOOM
              ? 'bg-[#5c4a8a] border-[#a89cc8] text-[#e8e4d9]'
              : 'bg-[#2d2d44] border-[#3d3d5c] text-[#b8b4a9] hover:bg-[#3d3d5c] hover:border-[#5c5c8a]'
          }`}
          title="Fit to screen"
        >
          {zoom === FIT_ZOOM ? 'Fit' : formatZoom(effectiveZoom)}
        </button>

        <button
          onClick={handleZoomIn}
          className="px-2 py-1 border-2 border-[#3d3d5c] bg-[#2d2d44] hover:bg-[#3d3d5c] hover:border-[#5c5c8a] text-[#b8b4a9] transition-all"
          title="Zoom in"
        >
          +
        </button>

        <span className="text-xs text-[#5c5c8a] ml-2">Pinch to zoom, scroll to pan</span>
      </div>
    </div>
  );
}
