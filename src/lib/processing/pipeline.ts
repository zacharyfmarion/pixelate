import type { RGB, ProcessingParams } from '../../types';
import { applyAdjustments } from './adjustments';
import { pixelate } from './pixelate';
import { applyBayerDithering, quantizeToPalette, buildColorLUT, type ColorLUT } from './dither';

export interface ProcessingOptions extends ProcessingParams {
  palette: RGB[];
  lut?: ColorLUT; // Optional pre-built LUT for faster color matching
}

export function processImage(
  imageData: ImageData,
  options: ProcessingOptions
): ImageData {
  let result = imageData;

  // Step 1: Apply color/brightness adjustments
  result = applyAdjustments(result, options.adjustments);

  // Step 2: Pixelation (optional)
  if (options.pixelation.enabled && options.pixelation.blockSize > 1) {
    result = pixelate(result, {
      blockSize: options.pixelation.blockSize,
    });
  }

  // Step 3: Dithering with palette (only if palette exists)
  if (options.palette.length > 0) {
    // Build LUT once for this processing pass (if not provided)
    const lut = options.lut ?? buildColorLUT(options.palette);

    if (options.dithering.enabled) {
      // Pass block size so dithering aligns with pixelation blocks
      const blockSize = options.pixelation.enabled ? options.pixelation.blockSize : 1;
      result = applyBayerDithering(result, {
        matrixSize: options.dithering.matrixSize,
        palette: options.palette,
        strength: options.dithering.strength,
        blockSize,
        lut,
      });
    } else {
      // Just quantize to palette without dithering
      result = quantizeToPalette(result, options.palette, lut);
    }
  }

  return result;
}

// Re-export for use by store/worker
export { buildColorLUT, type ColorLUT };
