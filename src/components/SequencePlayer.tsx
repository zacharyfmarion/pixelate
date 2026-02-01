import { useState, useEffect, useRef, memo } from 'react';
import { useAppStore } from '../store/appStore';
import { Slider, Button } from './ui';

export function SequencePlayer() {
  const frames = useAppStore((s) => s.frames);
  const currentFrameIndex = useAppStore((s) => s.currentFrameIndex);
  const setCurrentFrame = useAppStore((s) => s.setCurrentFrame);
  const clearFrames = useAppStore((s) => s.clearFrames);
  const removeFrame = useAppStore((s) => s.removeFrame);
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
      <div className="flex items-center justify-between border-b border-[#3d3d5c] pb-1">
        <h3 className="text-xs text-[#7c6f9b] uppercase tracking-widest">› Sequence</h3>
        <Button variant="ghost" size="sm" onClick={clearFrames}>
          Clear All
        </Button>
      </div>

      <div className="flex items-center gap-2">
        {frames.length > 1 && (
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-2 border-2 border-[#3d3d5c] bg-[#2d2d44] hover:bg-[#3d3d5c] hover:border-[#5c5c8a] transition-all"
          >
            {isPlaying ? (
              <span className="text-[#a89cc8]">▮▮</span>
            ) : (
              <span className="text-[#a89cc8]">▶</span>
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
          <div
            key={frame.id}
            className="relative flex-shrink-0 group"
          >
            <button
              onClick={() => setCurrentFrame(index)}
              className={`w-16 h-16 border-2 transition-all overflow-hidden ${
                index === currentFrameIndex
                  ? 'border-[#a89cc8] shadow-[2px_2px_0_#5c4a8a]'
                  : 'border-[#3d3d5c] hover:border-[#5c5c8a]'
              }`}
            >
              <FrameThumbnail frameId={frame.id} version={processedVersion} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeFrame(frame.id);
              }}
              className="absolute -top-1 -right-1 w-5 h-5 bg-[#a83232] hover:bg-[#c84848] border border-[#ff6b6b] text-[#e8e4d9] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              title="Remove frame"
            >
              ×
            </button>
          </div>
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
    canvas.width = 64;
    canvas.height = 64;
    ctx.drawImage(tempCanvas, 0, 0, 64, 64);
  }, [frameId, version, getProcessedImageData, getOriginalImageData]);

  return <canvas ref={canvasRef} className="w-full h-full object-cover" style={{ imageRendering: 'pixelated' }} />;
});
