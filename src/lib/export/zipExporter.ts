import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import type { ImageFrame } from '../../types';

export interface ZipExportOptions {
  onProgress?: (progress: number) => void;
}

export async function exportToZip(
  frames: ImageFrame[],
  options: ZipExportOptions = {}
): Promise<void> {
  if (frames.length === 0) {
    throw new Error('No frames to export');
  }

  const zip = new JSZip();
  const folder = zip.folder('frames');

  if (!folder) {
    throw new Error('Failed to create ZIP folder');
  }

  // Create canvas for converting ImageData to PNG
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i];
    const imageData = frame.processed || frame.original;

    canvas.width = imageData.width;
    canvas.height = imageData.height;
    ctx.putImageData(imageData, 0, 0);

    // Convert to PNG blob
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => resolve(b!), 'image/png');
    });

    // Pad frame number for proper sorting
    const frameNum = String(i + 1).padStart(4, '0');
    const filename = `frame_${frameNum}.png`;

    folder.file(filename, blob);
    options.onProgress?.((i + 1) / frames.length);
  }

  // Generate and download
  const content = await zip.generateAsync({ type: 'blob' });
  saveAs(content, 'pixelated_frames.zip');
}
