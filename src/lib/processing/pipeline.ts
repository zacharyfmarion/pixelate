import type { RGB, ProcessingParams } from '../../types';
import { pixelate } from './pixelate';
import { applyBayerDithering, quantizeToPalette } from './dither';

export interface ProcessingOptions extends ProcessingParams {
  palette: RGB[];
}

export function processImage(
  imageData: ImageData,
  options: ProcessingOptions
): ImageData {
  let result = imageData;

  // Step 1: Pixelation (optional)
  if (options.pixelation.enabled && options.pixelation.blockSize > 1) {
    result = pixelate(result, {
      blockSize: options.pixelation.blockSize,
    });
  }

  // Step 2: Dithering with palette (only if palette exists)
  if (options.palette.length > 0) {
    if (options.dithering.enabled) {
      result = applyBayerDithering(result, {
        matrixSize: options.dithering.matrixSize,
        palette: options.palette,
        strength: options.dithering.strength,
      });
    } else {
      // Just quantize to palette without dithering
      result = quantizeToPalette(result, options.palette);
    }
  }

  return result;
}
