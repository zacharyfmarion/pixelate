import { useState, useEffect, useRef, memo } from 'react';
import { useAppStore } from '../store/appStore';
import { Slider, Button } from './ui';

export function SequencePlayer() {
  const frames = useAppStore((s) => s.frames);
  const currentFrameIndex = useAppStore((s) => s.currentFrameIndex);
  const setCurrentFrame = useAppStore((s) => s.setCurrentFrame);
  const clearFrames = useAppStore((s) => s.clearFrames);
  // Subscribe to processedVersion to re-render when images are processed
  const processedVersion = useAppStore((s) => s.processedVersion);

  const [isPlaying, setIsPlaying] = useState(false);
  const [fps, setFps] = useState(10);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (isPlaying && frames.length > 1) {
      intervalRef.current = window.setInterval(() => {
        setCurrentFrame((currentFrameIndex + 1) % frames.length);
      }, 1000 / fps);
    }

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, fps, currentFrameIndex, frames.length, setCurrentFrame]);

  if (frames.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-200">Sequence</h3>
        <Button variant="ghost" size="sm" onClick={clearFrames}>
          Clear All
        </Button>
      </div>

      <div className="flex items-center gap-2">
        {frames.length > 1 && (
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
          >
            {isPlaying ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
        )}
        <div className="flex-1">
          <Slider
            label=""
            value={currentFrameIndex}
            min={0}
            max={Math.max(0, frames.length - 1)}
            step={1}
            onChange={setCurrentFrame}
            valueFormatter={(v) => `${v + 1} / ${frames.length}`}
          />
        </div>
      </div>

      {frames.length > 1 && (
        <Slider
          label="Playback Speed"
          value={fps}
          min={1}
          max={30}
          step={1}
          onChange={setFps}
          valueFormatter={(v) => `${v} FPS`}
        />
      )}

      <div className="flex gap-1 overflow-x-auto py-1">
        {frames.map((frame, index) => (
          <button
            key={frame.id}
            onClick={() => setCurrentFrame(index)}
            className={`flex-shrink-0 w-12 h-12 rounded border-2 transition-colors overflow-hidden ${
              index === currentFrameIndex
                ? 'border-indigo-500'
                : 'border-gray-600 hover:border-gray-500'
            }`}
          >
            <FrameThumbnail frameId={frame.id} version={processedVersion} />
          </button>
        ))}
      </div>
    </div>
  );
}

// Memoized thumbnail - only re-renders when frameId or version changes
const FrameThumbnail = memo(function FrameThumbnail({
  frameId,
  version
}: {
  frameId: string;
  version: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const getProcessedImageData = useAppStore((s) => s.getProcessedImageData);
  const getOriginalImageData = useAppStore((s) => s.getOriginalImageData);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Get image data inside the effect, not as a prop
    const imageData = getProcessedImageData(frameId) || getOriginalImageData(frameId);
    if (!imageData) return;

    // Create a temporary canvas with the original size
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = imageData.width;
    tempCanvas.height = imageData.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    tempCtx.putImageData(imageData, 0, 0);

    // Scale down to thumbnail size
    canvas.width = 48;
    canvas.height = 48;
    ctx.drawImage(tempCanvas, 0, 0, 48, 48);
  }, [frameId, version, getProcessedImageData, getOriginalImageData]);

  return <canvas ref={canvasRef} className="w-full h-full object-cover" />;
});
