import type { RGB } from '../../types';
import { type ColorLUT, buildColorLUT } from './colorLUT';

// Pre-computed Bayer matrices as flat Float32Arrays for faster access
// Values are pre-scaled: (threshold - 0.5) ready for multiplication with spread
const BAYER_2x2 = new Float32Array([
  (0 / 4 - 0.5), (2 / 4 - 0.5),
  (3 / 4 - 0.5), (1 / 4 - 0.5),
]);

const BAYER_4x4 = new Float32Array([
  (0 / 16 - 0.5), (8 / 16 - 0.5), (2 / 16 - 0.5), (10 / 16 - 0.5),
  (12 / 16 - 0.5), (4 / 16 - 0.5), (14 / 16 - 0.5), (6 / 16 - 0.5),
  (3 / 16 - 0.5), (11 / 16 - 0.5), (1 / 16 - 0.5), (9 / 16 - 0.5),
  (15 / 16 - 0.5), (7 / 16 - 0.5), (13 / 16 - 0.5), (5 / 16 - 0.5),
]);

const BAYER_8x8 = new Float32Array([
  (0 / 64 - 0.5), (32 / 64 - 0.5), (8 / 64 - 0.5), (40 / 64 - 0.5), (2 / 64 - 0.5), (34 / 64 - 0.5), (10 / 64 - 0.5), (42 / 64 - 0.5),
  (48 / 64 - 0.5), (16 / 64 - 0.5), (56 / 64 - 0.5), (24 / 64 - 0.5), (50 / 64 - 0.5), (18 / 64 - 0.5), (58 / 64 - 0.5), (26 / 64 - 0.5),
  (12 / 64 - 0.5), (44 / 64 - 0.5), (4 / 64 - 0.5), (36 / 64 - 0.5), (14 / 64 - 0.5), (46 / 64 - 0.5), (6 / 64 - 0.5), (38 / 64 - 0.5),
  (60 / 64 - 0.5), (28 / 64 - 0.5), (52 / 64 - 0.5), (20 / 64 - 0.5), (62 / 64 - 0.5), (30 / 64 - 0.5), (54 / 64 - 0.5), (22 / 64 - 0.5),
  (3 / 64 - 0.5), (35 / 64 - 0.5), (11 / 64 - 0.5), (43 / 64 - 0.5), (1 / 64 - 0.5), (33 / 64 - 0.5), (9 / 64 - 0.5), (41 / 64 - 0.5),
  (51 / 64 - 0.5), (19 / 64 - 0.5), (59 / 64 - 0.5), (27 / 64 - 0.5), (49 / 64 - 0.5), (17 / 64 - 0.5), (57 / 64 - 0.5), (25 / 64 - 0.5),
  (15 / 64 - 0.5), (47 / 64 - 0.5), (7 / 64 - 0.5), (39 / 64 - 0.5), (13 / 64 - 0.5), (45 / 64 - 0.5), (5 / 64 - 0.5), (37 / 64 - 0.5),
  (63 / 64 - 0.5), (31 / 64 - 0.5), (55 / 64 - 0.5), (23 / 64 - 0.5), (61 / 64 - 0.5), (29 / 64 - 0.5), (53 / 64 - 0.5), (21 / 64 - 0.5),
]);

export type BayerMatrixSize = 2 | 4 | 8;

export interface DitherOptions {
  matrixSize: BayerMatrixSize;
  palette: RGB[];
  strength: number;
  blockSize?: number; // If provided, dithering is applied at block level
  lut?: ColorLUT; // Optional pre-built LUT for faster color matching
}

function getBayerMatrix(size: BayerMatrixSize): Float32Array {
  switch (size) {
    case 2:
      return BAYER_2x2;
    case 4:
      return BAYER_4x4;
    case 8:
      return BAYER_8x8;
  }
}

// Keep for quantizeToPalette which is called less frequently
function findNearestColor(r: number, g: number, b: number, palette: RGB[]): RGB {
  let minDist = Infinity;
  let nearest = palette[0];

  for (let i = 0; i < palette.length; i++) {
    const pc = palette[i];
    const dist =
      2 * (r - pc.r) ** 2 +
      4 * (g - pc.g) ** 2 +
      3 * (b - pc.b) ** 2;

    if (dist < minDist) {
      minDist = dist;
      nearest = pc;
    }
  }

  return nearest;
}

export function applyBayerDithering(
  imageData: ImageData,
  options: DitherOptions
): ImageData {
  const { matrixSize, palette, strength, blockSize = 1 } = options;

  // Build or use provided LUT for O(1) color matching
  const lut = options.lut ?? buildColorLUT(palette);

  const matrix = getBayerMatrix(matrixSize);
  const { width, height, data } = imageData;

  const output = new ImageData(width, height);
  const outData = output.data;

  const spread = strength * 64;
  const len = data.length;
  const lutTable = lut.table;
  const lutPalette = lut.palette;
  const hasLUT = lutTable.length > 0;

  // Pre-compute inverse block size for faster division
  const invBlockSize = 1 / blockSize;

  for (let i = 0; i < len; i += 4) {
    const pixelIdx = i >> 2; // i / 4
    const x = pixelIdx % width;
    const y = (pixelIdx / width) | 0; // Integer division

    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    // Use block coordinates for dithering pattern when blockSize > 1
    const blockX = (x * invBlockSize) | 0;
    const blockY = (y * invBlockSize) | 0;

    // Get pre-computed threshold offset from flat matrix
    const matrixIdx = (blockY % matrixSize) * matrixSize + (blockX % matrixSize);
    const offset = matrix[matrixIdx] * spread;

    // Clamp adjusted values (inline for speed)
    let adjustedR = r + offset;
    let adjustedG = g + offset;
    let adjustedB = b + offset;

    if (adjustedR < 0) adjustedR = 0;
    else if (adjustedR > 255) adjustedR = 255;
    if (adjustedG < 0) adjustedG = 0;
    else if (adjustedG > 255) adjustedG = 255;
    if (adjustedB < 0) adjustedB = 0;
    else if (adjustedB > 255) adjustedB = 255;

    // Find nearest color using LUT (O(1)) or fallback
    let nr: number, ng: number, nb: number;

    if (hasLUT) {
      // Quantize to 32 levels and lookup
      const rq = adjustedR >> 3;
      const gq = adjustedG >> 3;
      const bq = adjustedB >> 3;
      const lutIdx = (rq << 10) + (gq << 5) + bq;
      const pc = lutPalette[lutTable[lutIdx]];
      nr = pc.r;
      ng = pc.g;
      nb = pc.b;
    } else {
      const nearest = findNearestColor(adjustedR, adjustedG, adjustedB, palette);
      nr = nearest.r;
      ng = nearest.g;
      nb = nearest.b;
    }

    outData[i] = nr;
    outData[i + 1] = ng;
    outData[i + 2] = nb;
    outData[i + 3] = a;
  }

  return output;
}

export function quantizeToPalette(
  imageData: ImageData,
  palette: RGB[],
  lut?: ColorLUT
): ImageData {
  const { width, height, data } = imageData;
  const output = new ImageData(width, height);
  const outData = output.data;

  // Build LUT if not provided
  const colorLUT = lut ?? buildColorLUT(palette);
  const len = data.length;
  const lutTable = colorLUT.table;
  const lutPalette = colorLUT.palette;
  const hasLUT = lutTable.length > 0;

  for (let i = 0; i < len; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    let nr: number, ng: number, nb: number;

    if (hasLUT) {
      const rq = r >> 3;
      const gq = g >> 3;
      const bq = b >> 3;
      const lutIdx = (rq << 10) + (gq << 5) + bq;
      const pc = lutPalette[lutTable[lutIdx]];
      nr = pc.r;
      ng = pc.g;
      nb = pc.b;
    } else {
      const nearest = findNearestColor(r, g, b, palette);
      nr = nearest.r;
      ng = nearest.g;
      nb = nearest.b;
    }

    outData[i] = nr;
    outData[i + 1] = ng;
    outData[i + 2] = nb;
    outData[i + 3] = data[i + 3];
  }

  return output;
}

// Re-export buildColorLUT for use in pipeline
export { buildColorLUT, type ColorLUT } from './colorLUT';
