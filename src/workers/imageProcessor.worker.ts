// Web Worker for image processing - runs off main thread
// Types are inlined to avoid import issues with Vite workers

// ===== Inlined Types =====
interface RGB {
  r: number;
  g: number;
  b: number;
}

interface ProcessingParams {
  adjustments: {
    brightness: number;
    contrast: number;
    saturation: number;
    hue: number;
  };
  pixelation: {
    enabled: boolean;
    blockSize: number;
  };
  dithering: {
    enabled: boolean;
    matrixSize: 2 | 4 | 8;
    strength: number;
  };
}

// ===== Color LUT =====
interface ColorLUT {
  table: Uint8Array;
  palette: RGB[];
}

function buildColorLUT(palette: RGB[]): ColorLUT {
  if (palette.length === 0) {
    return { table: new Uint8Array(0), palette: [] };
  }

  const LUT_SIZE = 32;
  const SHIFT = 3;
  const tableSize = LUT_SIZE * LUT_SIZE * LUT_SIZE;
  const table = new Uint8Array(tableSize);

  for (let rq = 0; rq < LUT_SIZE; rq++) {
    for (let gq = 0; gq < LUT_SIZE; gq++) {
      for (let bq = 0; bq < LUT_SIZE; bq++) {
        const r = (rq << SHIFT) + 4;
        const g = (gq << SHIFT) + 4;
        const b = (bq << SHIFT) + 4;

        let minDist = Infinity;
        let nearestIdx = 0;

        for (let i = 0; i < palette.length; i++) {
          const pc = palette[i];
          const dist =
            2 * (r - pc.r) ** 2 +
            4 * (g - pc.g) ** 2 +
            3 * (b - pc.b) ** 2;

          if (dist < minDist) {
            minDist = dist;
            nearestIdx = i;
          }
        }

        const idx = (rq << 10) + (gq << 5) + bq;
        table[idx] = nearestIdx;
      }
    }
  }

  return { table, palette };
}

// ===== Adjustments =====
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return [h * 360, s * 100, l * 100];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h /= 360;
  s /= 100;
  l /= 100;

  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function applyAdjustments(
  data: Uint8ClampedArray,
  _width: number,
  _height: number,
  brightness: number,
  contrast: number,
  saturation: number,
  hue: number
): Uint8ClampedArray {
  if (brightness === 0 && contrast === 0 && saturation === 0 && hue === 0) {
    return data;
  }

  const output = new Uint8ClampedArray(data.length);
  const contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));
  const len = data.length;

  for (let i = 0; i < len; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    if (brightness !== 0) {
      const brightnessOffset = (brightness / 100) * 255;
      r = clamp(r + brightnessOffset, 0, 255);
      g = clamp(g + brightnessOffset, 0, 255);
      b = clamp(b + brightnessOffset, 0, 255);
    }

    if (contrast !== 0) {
      r = clamp(contrastFactor * (r - 128) + 128, 0, 255);
      g = clamp(contrastFactor * (g - 128) + 128, 0, 255);
      b = clamp(contrastFactor * (b - 128) + 128, 0, 255);
    }

    if (saturation !== 0 || hue !== 0) {
      let [h, s, l] = rgbToHsl(r, g, b);
      if (hue !== 0) h = (h + hue + 360) % 360;
      if (saturation !== 0) s = clamp(s + saturation, 0, 100);
      [r, g, b] = hslToRgb(h, s, l);
    }

    output[i] = r;
    output[i + 1] = g;
    output[i + 2] = b;
    output[i + 3] = data[i + 3];
  }

  return output;
}

// ===== Pixelation =====
function pixelate(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  blockSize: number
): Uint8ClampedArray {
  const output = new Uint8ClampedArray(data.length);

  for (let blockY = 0; blockY < height; blockY += blockSize) {
    for (let blockX = 0; blockX < width; blockX += blockSize) {
      const bw = Math.min(blockSize, width - blockX);
      const bh = Math.min(blockSize, height - blockY);

      let r = 0, g = 0, b = 0, a = 0;
      const count = bw * bh;

      for (let py = 0; py < bh; py++) {
        for (let px = 0; px < bw; px++) {
          const idx = ((blockY + py) * width + (blockX + px)) * 4;
          r += data[idx];
          g += data[idx + 1];
          b += data[idx + 2];
          a += data[idx + 3];
        }
      }

      const avgR = Math.round(r / count);
      const avgG = Math.round(g / count);
      const avgB = Math.round(b / count);
      const avgA = Math.round(a / count);

      for (let py = 0; py < bh; py++) {
        for (let px = 0; px < bw; px++) {
          const idx = ((blockY + py) * width + (blockX + px)) * 4;
          output[idx] = avgR;
          output[idx + 1] = avgG;
          output[idx + 2] = avgB;
          output[idx + 3] = avgA;
        }
      }
    }
  }

  return output;
}

// ===== Bayer Dithering =====
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

function getBayerMatrix(size: 2 | 4 | 8): Float32Array {
  switch (size) {
    case 2: return BAYER_2x2;
    case 4: return BAYER_4x4;
    case 8: return BAYER_8x8;
  }
}

function applyBayerDithering(
  data: Uint8ClampedArray,
  width: number,
  _height: number,
  matrixSize: 2 | 4 | 8,
  strength: number,
  blockSize: number,
  lut: ColorLUT
): Uint8ClampedArray {
  const matrix = getBayerMatrix(matrixSize);
  const output = new Uint8ClampedArray(data.length);
  const spread = strength * 64;
  const len = data.length;
  const lutTable = lut.table;
  const lutPalette = lut.palette;
  const hasLUT = lutTable.length > 0;
  const invBlockSize = 1 / blockSize;

  for (let i = 0; i < len; i += 4) {
    const pixelIdx = i >> 2;
    const x = pixelIdx % width;
    const y = (pixelIdx / width) | 0;

    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    const blockX = (x * invBlockSize) | 0;
    const blockY = (y * invBlockSize) | 0;
    const matrixIdx = (blockY % matrixSize) * matrixSize + (blockX % matrixSize);
    const offset = matrix[matrixIdx] * spread;

    let adjustedR = r + offset;
    let adjustedG = g + offset;
    let adjustedB = b + offset;

    if (adjustedR < 0) adjustedR = 0;
    else if (adjustedR > 255) adjustedR = 255;
    if (adjustedG < 0) adjustedG = 0;
    else if (adjustedG > 255) adjustedG = 255;
    if (adjustedB < 0) adjustedB = 0;
    else if (adjustedB > 255) adjustedB = 255;

    let nr: number, ng: number, nb: number;

    if (hasLUT) {
      const rq = adjustedR >> 3;
      const gq = adjustedG >> 3;
      const bq = adjustedB >> 3;
      const lutIdx = (rq << 10) + (gq << 5) + bq;
      const pc = lutPalette[lutTable[lutIdx]];
      nr = pc.r;
      ng = pc.g;
      nb = pc.b;
    } else {
      nr = adjustedR;
      ng = adjustedG;
      nb = adjustedB;
    }

    output[i] = nr;
    output[i + 1] = ng;
    output[i + 2] = nb;
    output[i + 3] = a;
  }

  return output;
}

function quantizeToPalette(
  data: Uint8ClampedArray,
  _width: number,
  _height: number,
  lut: ColorLUT
): Uint8ClampedArray {
  const output = new Uint8ClampedArray(data.length);
  const len = data.length;
  const lutTable = lut.table;
  const lutPalette = lut.palette;
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
      nr = r;
      ng = g;
      nb = b;
    }

    output[i] = nr;
    output[i + 1] = ng;
    output[i + 2] = nb;
    output[i + 3] = data[i + 3];
  }

  return output;
}

// ===== Message Handler =====
interface ProcessRequest {
  type: 'process';
  requestId: number;
  imageBuffer: ArrayBuffer;
  width: number;
  height: number;
  params: ProcessingParams;
  palette: RGB[];
}

interface ProcessResponse {
  type: 'result';
  requestId: number;
  imageBuffer: ArrayBuffer;
  width: number;
  height: number;
}

self.onmessage = (e: MessageEvent<ProcessRequest>) => {
  const { requestId, imageBuffer, width, height, params, palette } = e.data;

  // Convert ArrayBuffer to Uint8ClampedArray
  // Use explicit type to allow reassignment from functions returning Uint8ClampedArray
  let data: Uint8ClampedArray = new Uint8ClampedArray(imageBuffer);

  // Step 1: Adjustments
  data = applyAdjustments(
    data,
    width,
    height,
    params.adjustments.brightness,
    params.adjustments.contrast,
    params.adjustments.saturation,
    params.adjustments.hue
  );

  // Step 2: Pixelation
  if (params.pixelation.enabled && params.pixelation.blockSize > 1) {
    data = pixelate(data, width, height, params.pixelation.blockSize);
  }

  // Step 3: Dithering/Quantization
  if (palette.length > 0) {
    const lut = buildColorLUT(palette);
    const blockSize = params.pixelation.enabled ? params.pixelation.blockSize : 1;

    if (params.dithering.enabled) {
      data = applyBayerDithering(
        data,
        width,
        height,
        params.dithering.matrixSize,
        params.dithering.strength,
        blockSize,
        lut
      );
    } else {
      data = quantizeToPalette(data, width, height, lut);
    }
  }

  // Transfer the buffer back (zero-copy)
  const outputBuffer = data.buffer as ArrayBuffer;
  const response: ProcessResponse = {
    type: 'result',
    requestId,
    imageBuffer: outputBuffer,
    width,
    height,
  };

  self.postMessage(response, { transfer: [outputBuffer] });
};
