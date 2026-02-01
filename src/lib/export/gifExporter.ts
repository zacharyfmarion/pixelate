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
  /** When true, scale down so each visual pixel becomes 1 actual pixel */
  exportAtPixelSize?: boolean;
  /** Block size used for pixelation (needed when exportAtPixelSize is true) */
  blockSize?: number;
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

    // Calculate output dimensions
    const blockSize = options.blockSize ?? 1;
    const scaleFactor = options.exportAtPixelSize && blockSize > 1 ? blockSize : 1;
    const outputWidth = Math.floor(firstImageData.width / scaleFactor);
    const outputHeight = Math.floor(firstImageData.height / scaleFactor);

    const gif = new GIF({
      workers: 2,
      quality: options.quality,
      width: outputWidth,
      height: outputHeight,
      workerScript: `${import.meta.env.BASE_URL}gif.worker.js`,
      repeat: options.loop ? 0 : -1,
    });

    // Create source canvas for ImageData
    const sourceCanvas = document.createElement('canvas');
    sourceCanvas.width = firstImageData.width;
    sourceCanvas.height = firstImageData.height;
    const sourceCtx = sourceCanvas.getContext('2d');

    // Create output canvas for rendering frames (may be scaled down)
    const canvas = document.createElement('canvas');
    canvas.width = outputWidth;
    canvas.height = outputHeight;
    const ctx = canvas.getContext('2d');

    if (!ctx || !sourceCtx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    // Disable image smoothing for crisp pixel art when scaling down
    ctx.imageSmoothingEnabled = false;

    // Add each frame
    for (const frame of frames) {
      const imageData = options.getProcessedImageData(frame.id) || options.getOriginalImageData(frame.id);
      if (imageData) {
        // Put the image data on the source canvas
        sourceCtx.putImageData(imageData, 0, 0);
        
        if (scaleFactor > 1) {
          // Scale down by drawing source canvas onto the smaller output canvas
          ctx.drawImage(sourceCanvas, 0, 0, outputWidth, outputHeight);
        } else {
          // No scaling needed, draw directly
          ctx.drawImage(sourceCanvas, 0, 0);
        }
        
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
