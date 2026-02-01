import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export interface FrameRef {
  id: string;
  width: number;
  height: number;
}

export interface PngExportOptions {
  onProgress?: (progress: number) => void;
  getProcessedImageData: (id: string) => ImageData | undefined;
  getOriginalImageData: (id: string) => ImageData | undefined;
  /** When true, scale down so each visual pixel becomes 1 actual pixel */
  exportAtPixelSize?: boolean;
  /** Block size used for pixelation (needed when exportAtPixelSize is true) */
  blockSize?: number;
}

/**
 * Export frames as PNG(s).
 * Single frame: downloads as a single PNG file.
 * Multiple frames: downloads as a ZIP of PNGs.
 */
export async function exportToPng(
  frames: FrameRef[],
  options: PngExportOptions
): Promise<void> {
  if (frames.length === 0) {
    throw new Error('No frames to export');
  }

  // Create source canvas for ImageData
  const sourceCanvas = document.createElement('canvas');
  const sourceCtx = sourceCanvas.getContext('2d');

  // Create output canvas (may be scaled down)
  const outputCanvas = document.createElement('canvas');
  const outputCtx = outputCanvas.getContext('2d');

  if (!sourceCtx || !outputCtx) {
    throw new Error('Could not get canvas context');
  }

  // Calculate scale factor
  const blockSize = options.blockSize ?? 1;
  const scaleFactor = options.exportAtPixelSize && blockSize > 1 ? blockSize : 1;

  // Helper to render a frame to the output canvas and return a blob
  const renderFrameToBlob = async (frame: FrameRef): Promise<Blob | null> => {
    const imageData = options.getProcessedImageData(frame.id) || options.getOriginalImageData(frame.id);
    if (!imageData) return null;

    // Set up source canvas
    sourceCanvas.width = imageData.width;
    sourceCanvas.height = imageData.height;
    sourceCtx.putImageData(imageData, 0, 0);

    // Calculate output dimensions
    const outputWidth = Math.floor(imageData.width / scaleFactor);
    const outputHeight = Math.floor(imageData.height / scaleFactor);
    outputCanvas.width = outputWidth;
    outputCanvas.height = outputHeight;

    // Disable image smoothing for crisp pixel art when scaling down
    outputCtx.imageSmoothingEnabled = false;

    if (scaleFactor > 1) {
      // Scale down by drawing source canvas onto the smaller output canvas
      outputCtx.drawImage(sourceCanvas, 0, 0, outputWidth, outputHeight);
    } else {
      // No scaling needed, draw directly
      outputCtx.drawImage(sourceCanvas, 0, 0);
    }

    // Convert to PNG blob
    return new Promise<Blob>((resolve) => {
      outputCanvas.toBlob((b) => resolve(b!), 'image/png');
    });
  };

  // Single frame: download as PNG directly
  if (frames.length === 1) {
    const blob = await renderFrameToBlob(frames[0]);
    if (blob) {
      saveAs(blob, 'pixelated.png');
    }
    options.onProgress?.(1);
    return;
  }

  // Multiple frames: create ZIP of PNGs
  const zip = new JSZip();
  const folder = zip.folder('frames');

  if (!folder) {
    throw new Error('Failed to create ZIP folder');
  }

  for (let i = 0; i < frames.length; i++) {
    const blob = await renderFrameToBlob(frames[i]);
    if (!blob) continue;

    // Pad frame number for proper sorting
    const frameNum = String(i + 1).padStart(4, '0');
    const filename = `frame_${frameNum}.png`;

    folder.file(filename, blob);
    options.onProgress?.((i + 1) / frames.length);
  }

  // Generate and download ZIP
  const content = await zip.generateAsync({ type: 'blob' });
  saveAs(content, 'pixelated_frames.zip');
}
