import { useEffect, useRef } from 'react';
import { useAppStore } from '../store/appStore';

export function useImageProcessor() {
  const frames = useAppStore((s) => s.frames);
  const currentFrameIndex = useAppStore((s) => s.currentFrameIndex);
  const processingParams = useAppStore((s) => s.processingParams);
  const palette = useAppStore((s) => s.palette);
  const processCurrentFrame = useAppStore((s) => s.processCurrentFrame);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Clear previous timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Debounce processing to avoid excessive computation
    debounceRef.current = setTimeout(() => {
      if (frames.length > 0) {
        processCurrentFrame();
      }
    }, 50);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [
    processingParams.pixelation.enabled,
    processingParams.pixelation.blockSize,
    processingParams.dithering.enabled,
    processingParams.dithering.matrixSize,
    processingParams.dithering.strength,
    palette,
    currentFrameIndex,
    frames.length,
    processCurrentFrame,
  ]);
}
