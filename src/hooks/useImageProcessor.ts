import { useEffect, useRef } from 'react';
import { useAppStore } from '../store/appStore';
import { cancelProcessing } from '../lib/processing/workerProcessor';

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

    // Cancel any in-flight processing when params change
    // (the worker wrapper will ignore stale responses)

    // Debounce processing to avoid excessive computation
    debounceRef.current = setTimeout(() => {
      if (frames.length > 0) {
        // processCurrentFrame is async but we don't await it here
        // The store handles the async flow internally
        void processCurrentFrame();
      }
    }, 50);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [
    processingParams,
    palette,
    currentFrameIndex,
    frames.length,
    processCurrentFrame,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelProcessing();
    };
  }, []);
}
