import type { RGB } from '../../types';

/**
 * Export palette as GPL (GIMP Palette) format
 * This format is widely supported by GIMP, Inkscape, Krita, Aseprite, etc.
 */
export function exportAsGPL(colors: RGB[], name: string = 'Pixelate Palette'): string {
  const lines = [
    'GIMP Palette',
    `Name: ${name}`,
    `Columns: ${Math.min(colors.length, 16)}`,
    '#',
  ];

  for (const color of colors) {
    // GPL format: R G B    Color Name (tab-separated, values 0-255)
    const hex = rgbToHex(color);
    lines.push(`${color.r.toString().padStart(3)} ${color.g.toString().padStart(3)} ${color.b.toString().padStart(3)}\t${hex}`);
  }

  return lines.join('\n');
}

/**
 * Parse GPL (GIMP Palette) file content
 */
export function parseGPL(content: string): RGB[] {
  const lines = content.split('\n');
  const colors: RGB[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    // Skip header lines and comments
    if (
      trimmed.startsWith('GIMP Palette') ||
      trimmed.startsWith('Name:') ||
      trimmed.startsWith('Columns:') ||
      trimmed.startsWith('#') ||
      trimmed === ''
    ) {
      continue;
    }

    // Parse color line: "R G B    Name" or "R G B"
    const match = trimmed.match(/^\s*(\d+)\s+(\d+)\s+(\d+)/);
    if (match) {
      colors.push({
        r: parseInt(match[1], 10),
        g: parseInt(match[2], 10),
        b: parseInt(match[3], 10),
      });
    }
  }

  return colors;
}

/**
 * Export palette as PNG color strip
 */
export function exportAsPNG(colors: RGB[]): Blob {
  const canvas = document.createElement('canvas');
  canvas.width = colors.length;
  canvas.height = 1;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  for (let i = 0; i < colors.length; i++) {
    const color = colors[i];
    ctx.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
    ctx.fillRect(i, 0, 1, 1);
  }

  // Convert to blob synchronously using toDataURL
  const dataUrl = canvas.toDataURL('image/png');
  const byteString = atob(dataUrl.split(',')[1]);
  const mimeString = dataUrl.split(',')[0].split(':')[1].split(';')[0];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeString });
}

/**
 * Export palette as JSON
 */
export function exportAsJSON(colors: RGB[], name: string = 'Pixelate Palette'): string {
  return JSON.stringify({
    name,
    colors: colors.map(c => ({
      r: c.r,
      g: c.g,
      b: c.b,
      hex: rgbToHex(c),
    })),
  }, null, 2);
}

/**
 * Parse JSON palette file
 */
export function parseJSON(content: string): RGB[] {
  try {
    const data = JSON.parse(content);
    if (Array.isArray(data.colors)) {
      return data.colors.map((c: { r: number; g: number; b: number }) => ({
        r: c.r,
        g: c.g,
        b: c.b,
      }));
    }
    // Also support simple array format
    if (Array.isArray(data)) {
      return data.map((c: { r: number; g: number; b: number }) => ({
        r: c.r,
        g: c.g,
        b: c.b,
      }));
    }
  } catch {
    // Invalid JSON
  }
  return [];
}

/**
 * Download a file
 */
export function downloadFile(content: string | Blob, filename: string, mimeType?: string) {
  const blob = content instanceof Blob 
    ? content 
    : new Blob([content], { type: mimeType || 'text/plain' });
  
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Helper to convert RGB to hex
 */
function rgbToHex(color: RGB): string {
  return `#${color.r.toString(16).padStart(2, '0')}${color.g.toString(16).padStart(2, '0')}${color.b.toString(16).padStart(2, '0')}`.toUpperCase();
}

/**
 * Detect file type and parse palette
 */
export function parsePaletteFile(content: string, filename: string): RGB[] {
  const ext = filename.toLowerCase().split('.').pop();
  
  if (ext === 'gpl') {
    return parseGPL(content);
  }
  if (ext === 'json') {
    return parseJSON(content);
  }
  
  // Try to auto-detect
  if (content.startsWith('GIMP Palette')) {
    return parseGPL(content);
  }
  if (content.startsWith('{') || content.startsWith('[')) {
    return parseJSON(content);
  }
  
  return [];
}


