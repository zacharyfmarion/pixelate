import { useRef, useEffect, useState } from 'react';
import { useAppStore } from '../store/appStore';

export function PreviewCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showOriginal, setShowOriginal] = useState(false);

  const frames = useAppStore((s) => s.frames);
  const currentFrameIndex = useAppStore((s) => s.currentFrameIndex);
  const isProcessing = useAppStore((s) => s.isProcessing);

  const currentFrame = frames[currentFrameIndex];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !currentFrame) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imageData = showOriginal ? currentFrame.original : (currentFrame.processed || currentFrame.original);

    canvas.width = imageData.width;
    canvas.height = imageData.height;
    ctx.putImageData(imageData, 0, 0);
  }, [currentFrame, showOriginal]);

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

  return (
    <div className="flex-1 flex flex-col bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700 bg-gray-800">
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
      <div
        ref={containerRef}
        className="flex-1 overflow-auto p-4 flex items-center justify-center"
        style={{ background: 'repeating-conic-gradient(#1a1a1a 0% 25%, #222 0% 50%) 50% / 20px 20px' }}
      >
        <canvas
          ref={canvasRef}
          className="max-w-full max-h-full"
          style={{ imageRendering: 'pixelated' }}
        />
      </div>
    </div>
  );
}
