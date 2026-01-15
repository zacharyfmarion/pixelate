import GIF from 'gif.js';

export interface FrameRef {
  id: string;
  width: number;
  height: number;
}

export interface GifExportOptions {
  delay: number;
  loop: boolean;
  quality: number;
  onProgress?: (progress: number) => void;
  getProcessedImageData: (id: string) => ImageData | undefined;
  getOriginalImageData: (id: string) => ImageData | undefined;
}

export function exportToGif(
  frames: FrameRef[],
  options: GifExportOptions
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    if (frames.length === 0) {
      reject(new Error('No frames to export'));
      return;
    }

    const firstFrame = frames[0];
    const firstImageData = options.getProcessedImageData(firstFrame.id) || options.getOriginalImageData(firstFrame.id);

    if (!firstImageData) {
      reject(new Error('No image data for first frame'));
      return;
    }

    const gif = new GIF({
      workers: 2,
      quality: options.quality,
      width: firstImageData.width,
      height: firstImageData.height,
      workerScript: '/gif.worker.js',
      repeat: options.loop ? 0 : -1,
    });

    // Create canvas for rendering frames
    const canvas = document.createElement('canvas');
    canvas.width = firstImageData.width;
    canvas.height = firstImageData.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    // Add each frame
    for (const frame of frames) {
      const imageData = options.getProcessedImageData(frame.id) || options.getOriginalImageData(frame.id);
      if (imageData) {
        ctx.putImageData(imageData, 0, 0);
        gif.addFrame(ctx, { copy: true, delay: options.delay });
      }
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
