import GIF from 'gif.js';
import type { ImageFrame } from '../../types';

export interface GifExportOptions {
  delay: number;
  loop: boolean;
  quality: number;
  onProgress?: (progress: number) => void;
}

export function exportToGif(
  frames: ImageFrame[],
  options: GifExportOptions
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    if (frames.length === 0) {
      reject(new Error('No frames to export'));
      return;
    }

    const firstFrame = frames[0].processed || frames[0].original;

    const gif = new GIF({
      workers: 2,
      quality: options.quality,
      width: firstFrame.width,
      height: firstFrame.height,
      workerScript: '/gif.worker.js',
      repeat: options.loop ? 0 : -1,
    });

    // Create canvas for rendering frames
    const canvas = document.createElement('canvas');
    canvas.width = firstFrame.width;
    canvas.height = firstFrame.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    // Add each frame
    for (const frame of frames) {
      const imageData = frame.processed || frame.original;
      ctx.putImageData(imageData, 0, 0);
      gif.addFrame(ctx, { copy: true, delay: options.delay });
    }

    gif.on('progress', (p: number) => {
      options.onProgress?.(p);
    });

    gif.on('finished', (blob: Blob) => {
      resolve(blob);
    });

    gif.render();
  });
}
