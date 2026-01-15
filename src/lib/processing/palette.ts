import type { RGB } from '../../types';

export interface PaletteExtractionOptions {
  maxColors?: number;
  minColorDifference?: number;
}

export function extractPaletteFromStrip(
  imageData: ImageData,
  options: PaletteExtractionOptions = {}
): RGB[] {
  const { maxColors = 256, minColorDifference = 10 } = options;
  const { data } = imageData;

  // Use a Map to track unique colors
  const colorMap = new Map<string, RGB>();

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    // Skip fully transparent pixels
    if (a < 128) continue;

    const key = `${r},${g},${b}`;

    if (!colorMap.has(key)) {
      colorMap.set(key, { r, g, b });
    }
  }

  let colors = Array.from(colorMap.values());

  // Remove near-duplicate colors
  colors = deduplicateColors(colors, minColorDifference);

  // Limit to maxColors if specified
  if (colors.length > maxColors) {
    colors = sampleColors(colors, maxColors);
  }

  return colors;
}

function deduplicateColors(colors: RGB[], minDifference: number): RGB[] {
  const result: RGB[] = [];
  const minDistSq = minDifference ** 2;

  for (const color of colors) {
    const isDuplicate = result.some((existing) => {
      const dist =
        (color.r - existing.r) ** 2 +
        (color.g - existing.g) ** 2 +
        (color.b - existing.b) ** 2;
      return dist < minDistSq;
    });

    if (!isDuplicate) {
      result.push(color);
    }
  }

  return result;
}

function sampleColors(colors: RGB[], count: number): RGB[] {
  if (colors.length <= count) return colors;

  const result: RGB[] = [];
  const step = colors.length / count;

  for (let i = 0; i < count; i++) {
    const idx = Math.floor(i * step);
    result.push(colors[idx]);
  }

  return result;
}
