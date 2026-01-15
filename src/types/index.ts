export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface ImageFrame {
  id: string;
  name: string;
  original: ImageData;
  processed: ImageData | null;
  width: number;
  height: number;
}

export interface AdjustmentParams {
  brightness: number;
  contrast: number;
  saturation: number;
  hue: number;
}

export interface ProcessingParams {
  adjustments: AdjustmentParams;
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

export interface ExportSettings {
  format: 'gif' | 'zip';
  gifDelay: number;
  gifLoop: boolean;
  quality: number;
}
