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
      <div className="flex-1 flex items-center justify-center bg-gray-900 rounded-lg border border-gray-700">
        <div className="text-gray-500 text-center">
          <svg
            className="w-16 h-16 mx-auto mb-3 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p>Upload an image to get started</p>
        </div>
      </div>
    );
  }

  const displayWidth = currentFrame.width * effectiveZoom;
  const displayHeight = currentFrame.height * effectiveZoom;

  return (
    <div className="flex-1 flex flex-col bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-3 py-2 border-b border-gray-700 bg-gray-800">
        <div className="text-sm text-gray-300">
          {currentFrame.name}
          <span className="text-gray-500 ml-2">
            {currentFrame.width} x {currentFrame.height}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isProcessing && (
            <span className="text-xs text-indigo-400 animate-pulse">Processing...</span>
          )}
          <button
            onClick={() => setShowOriginal(!showOriginal)}
            className={`text-xs px-2 py-1 rounded transition-colors ${
              showOriginal
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {showOriginal ? 'Original' : 'Processed'}
          </button>
        </div>
      </div>

      {/* Outer container for sizing */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden"
        style={{
          background:
            'repeating-conic-gradient(#1a1a1a 0% 25%, #222 0% 50%) 50% / 20px 20px',
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
      <div className="flex-shrink-0 flex items-center justify-center gap-1 px-3 py-2 border-t border-gray-700 bg-gray-800">
        <button
          onClick={handleZoomOut}
          className="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-gray-200 transition-colors"
          title="Zoom out"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>

        <button
          onClick={handleFitToScreen}
          className={`px-2 py-1 text-xs rounded transition-colors min-w-[60px] ${
            zoom === FIT_ZOOM
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
          title="Fit to screen"
        >
          {zoom === FIT_ZOOM ? 'Fit' : formatZoom(effectiveZoom)}
        </button>

        <button
          onClick={handleZoomIn}
          className="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-gray-200 transition-colors"
          title="Zoom in"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
        </button>

        <span className="text-xs text-gray-500 ml-2">Pinch to zoom, scroll to pan</span>
      </div>
    </div>
  );
}
