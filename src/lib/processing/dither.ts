import type { RGB } from '../../types';

// Pre-computed Bayer matrices (normalized to 0-1 range)
const BAYER_2x2 = [
  [0 / 4, 2 / 4],
  [3 / 4, 1 / 4],
];

const BAYER_4x4 = [
  [0 / 16, 8 / 16, 2 / 16, 10 / 16],
  [12 / 16, 4 / 16, 14 / 16, 6 / 16],
  [3 / 16, 11 / 16, 1 / 16, 9 / 16],
  [15 / 16, 7 / 16, 13 / 16, 5 / 16],
];

const BAYER_8x8 = [
  [0 / 64, 32 / 64, 8 / 64, 40 / 64, 2 / 64, 34 / 64, 10 / 64, 42 / 64],
  [48 / 64, 16 / 64, 56 / 64, 24 / 64, 50 / 64, 18 / 64, 58 / 64, 26 / 64],
  [12 / 64, 44 / 64, 4 / 64, 36 / 64, 14 / 64, 46 / 64, 6 / 64, 38 / 64],
  [60 / 64, 28 / 64, 52 / 64, 20 / 64, 62 / 64, 30 / 64, 54 / 64, 22 / 64],
  [3 / 64, 35 / 64, 11 / 64, 43 / 64, 1 / 64, 33 / 64, 9 / 64, 41 / 64],
  [51 / 64, 19 / 64, 59 / 64, 27 / 64, 49 / 64, 17 / 64, 57 / 64, 25 / 64],
  [15 / 64, 47 / 64, 7 / 64, 39 / 64, 13 / 64, 45 / 64, 5 / 64, 37 / 64],
  [63 / 64, 31 / 64, 55 / 64, 23 / 64, 61 / 64, 29 / 64, 53 / 64, 21 / 64],
];

export type BayerMatrixSize = 2 | 4 | 8;

export interface DitherOptions {
  matrixSize: BayerMatrixSize;
  palette: RGB[];
  strength: number;
}

function getBayerMatrix(size: BayerMatrixSize): number[][] {
  switch (size) {
    case 2:
      return BAYER_2x2;
    case 4:
      return BAYER_4x4;
    case 8:
      return BAYER_8x8;
  }
}

function findNearestColor(color: RGB, palette: RGB[]): RGB {
  let minDist = Infinity;
  let nearest = palette[0];

  for (const paletteColor of palette) {
    // Weighted Euclidean distance for better perceptual matching
    const dist =
      2 * (color.r - paletteColor.r) ** 2 +
      4 * (color.g - paletteColor.g) ** 2 +
      3 * (color.b - paletteColor.b) ** 2;

    if (dist < minDist) {
      minDist = dist;
      nearest = paletteColor;
    }
  }

  return nearest;
}

export function applyBayerDithering(
  imageData: ImageData,
  options: DitherOptions
): ImageData {
  const { matrixSize, palette, strength } = options;
  const matrix = getBayerMatrix(matrixSize);
  const { width, height, data } = imageData;

  const output = new ImageData(width, height);
  const outData = output.data;

  const spread = strength * 64;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;

      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const a = data[idx + 3];

      // Get threshold from Bayer matrix (tiled)
      const threshold = matrix[y % matrixSize][x % matrixSize];

      // Apply threshold offset to color channels
      const offset = (threshold - 0.5) * spread;

      const adjustedR = Math.max(0, Math.min(255, r + offset));
      const adjustedG = Math.max(0, Math.min(255, g + offset));
      const adjustedB = Math.max(0, Math.min(255, b + offset));

      // Find nearest color in palette
      const nearest = findNearestColor(
        { r: adjustedR, g: adjustedG, b: adjustedB },
        palette
      );

      outData[idx] = nearest.r;
      outData[idx + 1] = nearest.g;
      outData[idx + 2] = nearest.b;
      outData[idx + 3] = a;
    }
  }

  return output;
}

export function quantizeToPalette(imageData: ImageData, palette: RGB[]): ImageData {
  const { width, height, data } = imageData;
  const output = new ImageData(width, height);
  const outData = output.data;

  for (let i = 0; i < data.length; i += 4) {
    const color = { r: data[i], g: data[i + 1], b: data[i + 2] };
    const nearest = findNearestColor(color, palette);

    outData[i] = nearest.r;
    outData[i + 1] = nearest.g;
    outData[i + 2] = nearest.b;
    outData[i + 3] = data[i + 3];
  }

  return output;
}
