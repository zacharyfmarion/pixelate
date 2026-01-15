import type { RGB } from '../../types';

// 32-level quantization = 32^3 = 32,768 entries
const LUT_SIZE = 32;
const SHIFT = 3; // 256 / 32 = 8 = 2^3

/**
 * Pre-computed 3D lookup table for O(1) nearest color matching.
 * Maps quantized RGB values (32x32x32) to palette indices.
 */
export interface ColorLUT {
  // Flat array: index = (r_q * 32 * 32) + (g_q * 32) + b_q
  table: Uint8Array;
  palette: RGB[];
}

/**
 * Build a color lookup table for a given palette.
 * This is expensive but only needs to run when the palette changes.
 */
export function buildColorLUT(palette: RGB[]): ColorLUT {
  if (palette.length === 0) {
    return { table: new Uint8Array(0), palette: [] };
  }

  const tableSize = LUT_SIZE * LUT_SIZE * LUT_SIZE;
  const table = new Uint8Array(tableSize);

  // For each quantized color, find the nearest palette color
  for (let rq = 0; rq < LUT_SIZE; rq++) {
    for (let gq = 0; gq < LUT_SIZE; gq++) {
      for (let bq = 0; bq < LUT_SIZE; bq++) {
        // Convert quantized back to approximate RGB (center of bucket)
        const r = (rq << SHIFT) + 4; // +4 to center in bucket
        const g = (gq << SHIFT) + 4;
        const b = (bq << SHIFT) + 4;

        // Find nearest palette color using weighted Euclidean distance
        let minDist = Infinity;
        let nearestIdx = 0;

        for (let i = 0; i < palette.length; i++) {
          const pc = palette[i];
          // Weighted for perceptual matching (same as original)
          const dist =
            2 * (r - pc.r) ** 2 +
            4 * (g - pc.g) ** 2 +
            3 * (b - pc.b) ** 2;

          if (dist < minDist) {
            minDist = dist;
            nearestIdx = i;
          }
        }

        const idx = (rq << 10) + (gq << 5) + bq; // rq * 1024 + gq * 32 + bq
        table[idx] = nearestIdx;
      }
    }
  }

  return { table, palette };
}

/**
 * Look up the nearest palette color for an RGB value.
 * O(1) operation using the pre-computed LUT.
 */
export function lookupColor(lut: ColorLUT, r: number, g: number, b: number): RGB {
  const rq = r >> SHIFT;
  const gq = g >> SHIFT;
  const bq = b >> SHIFT;
  const idx = (rq << 10) + (gq << 5) + bq;
  return lut.palette[lut.table[idx]];
}

/**
 * Look up the nearest palette color and return RGB values directly.
 * Avoids object allocation for hot loops.
 */
export function lookupColorValues(
  lut: ColorLUT,
  r: number,
  g: number,
  b: number
): [number, number, number] {
  const rq = r >> SHIFT;
  const gq = g >> SHIFT;
  const bq = b >> SHIFT;
  const idx = (rq << 10) + (gq << 5) + bq;
  const color = lut.palette[lut.table[idx]];
  return [color.r, color.g, color.b];
}
