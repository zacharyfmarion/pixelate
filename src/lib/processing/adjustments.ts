export interface AdjustmentOptions {
  brightness: number; // -100 to 100
  contrast: number; // -100 to 100
  saturation: number; // -100 to 100
  hue: number; // -180 to 180 degrees
}

// Convert RGB to HSL
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

// Convert HSL to RGB
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

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function applyAdjustments(
  imageData: ImageData,
  options: AdjustmentOptions
): ImageData {
  const { brightness, contrast, saturation, hue } = options;
  const { width, height, data } = imageData;

  // Skip if no adjustments
  if (brightness === 0 && contrast === 0 && saturation === 0 && hue === 0) {
    return imageData;
  }

  const output = new ImageData(width, height);
  const outData = output.data;

  // Pre-calculate contrast factor
  const contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];
    const a = data[i + 3];

    // Apply brightness
    if (brightness !== 0) {
      const brightnessOffset = (brightness / 100) * 255;
      r = clamp(r + brightnessOffset, 0, 255);
      g = clamp(g + brightnessOffset, 0, 255);
      b = clamp(b + brightnessOffset, 0, 255);
    }

    // Apply contrast
    if (contrast !== 0) {
      r = clamp(contrastFactor * (r - 128) + 128, 0, 255);
      g = clamp(contrastFactor * (g - 128) + 128, 0, 255);
      b = clamp(contrastFactor * (b - 128) + 128, 0, 255);
    }

    // Apply saturation and hue (requires HSL conversion)
    if (saturation !== 0 || hue !== 0) {
      let [h, s, l] = rgbToHsl(r, g, b);

      // Apply hue rotation
      if (hue !== 0) {
        h = (h + hue + 360) % 360;
      }

      // Apply saturation
      if (saturation !== 0) {
        s = clamp(s + saturation, 0, 100);
      }

      [r, g, b] = hslToRgb(h, s, l);
    }

    outData[i] = r;
    outData[i + 1] = g;
    outData[i + 2] = b;
    outData[i + 3] = a;
  }

  return output;
}
