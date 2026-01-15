import { create } from 'zustand';
import type { RGB, ImageFrame, ProcessingParams, ExportSettings, AdjustmentParams } from '../types';
import { extractPaletteFromStrip } from '../lib/processing/palette';
import { processImageAsync } from '../lib/processing/workerProcessor';

// Store ImageData OUTSIDE of zustand to avoid any serialization/proxy overhead
const imageCache = {
  original: new Map<string, ImageData>(),
  processed: new Map<string, ImageData>(),
};

export interface FrameRef {
  id: string;
  name: string;
  width: number;
  height: number;
}

interface AppState {
  frames: FrameRef[];
  currentFrameIndex: number;
  isProcessing: boolean;
  palette: RGB[];
  processingParams: ProcessingParams;
  exportSettings: ExportSettings;
  isExporting: boolean;
  exportProgress: number;
  // Version counter to trigger re-renders when processed images change
  processedVersion: number;
}

interface AppActions {
  addFrames: (frames: ImageFrame[]) => void;
  removeFrame: (id: string) => void;
  clearFrames: () => void;
  setCurrentFrame: (index: number) => void;
  setColorStrip: (imageData: ImageData | null) => void;
  setPalette: (colors: RGB[]) => void;
  updateAdjustments: (params: Partial<AdjustmentParams>) => void;
  resetAdjustments: () => void;
  updatePixelation: (params: Partial<ProcessingParams['pixelation']>) => void;
  updateDithering: (params: Partial<ProcessingParams['dithering']>) => void;
  updateExportSettings: (settings: Partial<ExportSettings>) => void;
  setExportProgress: (progress: number) => void;
  setIsExporting: (isExporting: boolean) => void;
  processCurrentFrame: () => Promise<void>;
  processAllFrames: () => Promise<void>;
  getOriginalImageData: (id: string) => ImageData | undefined;
  getProcessedImageData: (id: string) => ImageData | undefined;
}

const initialAdjustments: AdjustmentParams = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  hue: 0,
};

const initialProcessingParams: ProcessingParams = {
  adjustments: initialAdjustments,
  pixelation: {
    enabled: true,
    blockSize: 8,
  },
  dithering: {
    enabled: true,
    matrixSize: 4,
    strength: 0.5,
  },
};

export const useAppStore = create<AppState & AppActions>()((set, get) => ({
  // Initial state
  frames: [],
  currentFrameIndex: 0,
  isProcessing: false,
  palette: [],
  processingParams: initialProcessingParams,
  exportSettings: {
    format: 'gif',
    gifDelay: 100,
    gifLoop: true,
    quality: 10,
  },
  isExporting: false,
  exportProgress: 0,
  processedVersion: 0,

  // Frame actions
  addFrames: (newFrames) => {
    // Store ImageData in cache, not in zustand
    const frameRefs: FrameRef[] = newFrames.map(f => {
      imageCache.original.set(f.id, f.original);
      if (f.processed) {
        imageCache.processed.set(f.id, f.processed);
      }
      return {
        id: f.id,
        name: f.name,
        width: f.width,
        height: f.height,
      };
    });
    set(state => ({ frames: [...state.frames, ...frameRefs] }));
  },

  removeFrame: (id) => {
    imageCache.original.delete(id);
    imageCache.processed.delete(id);
    set(state => {
      const newFrames = state.frames.filter(f => f.id !== id);
      return {
        frames: newFrames,
        currentFrameIndex: state.currentFrameIndex >= newFrames.length
          ? Math.max(0, newFrames.length - 1)
          : state.currentFrameIndex,
      };
    });
  },

  clearFrames: () => {
    imageCache.original.clear();
    imageCache.processed.clear();
    set({ frames: [], currentFrameIndex: 0 });
  },

  setCurrentFrame: (index) => set({ currentFrameIndex: index }),

  // Palette actions
  setColorStrip: (imageData) => {
    if (imageData) {
      const colors = extractPaletteFromStrip(imageData);
      set({ palette: colors });
    }
  },

  setPalette: (colors) => set({ palette: colors }),

  // Processing param actions (simple object spread, no immer)
  updateAdjustments: (params) => set(state => ({
    processingParams: {
      ...state.processingParams,
      adjustments: { ...state.processingParams.adjustments, ...params },
    },
  })),

  resetAdjustments: () => set(state => ({
    processingParams: {
      ...state.processingParams,
      adjustments: { ...initialAdjustments },
    },
  })),

  updatePixelation: (params) => set(state => ({
    processingParams: {
      ...state.processingParams,
      pixelation: { ...state.processingParams.pixelation, ...params },
    },
  })),

  updateDithering: (params) => set(state => ({
    processingParams: {
      ...state.processingParams,
      dithering: { ...state.processingParams.dithering, ...params },
    },
  })),

  // Export actions
  updateExportSettings: (settings) => set(state => ({
    exportSettings: { ...state.exportSettings, ...settings },
  })),

  setExportProgress: (progress) => set({ exportProgress: progress }),
  setIsExporting: (isExporting) => set({ isExporting }),

  // Image data accessors (read from cache, not state)
  getOriginalImageData: (id) => imageCache.original.get(id),
  getProcessedImageData: (id) => imageCache.processed.get(id),

  // Processing actions
  processCurrentFrame: async () => {
    const state = get();
    const frame = state.frames[state.currentFrameIndex];
    if (!frame) return;

    const original = imageCache.original.get(frame.id);
    if (!original) return;

    set({ isProcessing: true });

    try {
      const processed = await processImageAsync({
        imageData: original,
        params: state.processingParams,
        palette: state.palette,
      });

      imageCache.processed.set(frame.id, processed);
      set(state => ({ isProcessing: false, processedVersion: state.processedVersion + 1 }));
    } catch (error) {
      if ((error as Error).message !== 'Processing cancelled') {
        console.error('Processing failed:', error);
      }
      set({ isProcessing: false });
    }
  },

  processAllFrames: async () => {
    const state = get();
    set({ isProcessing: true });

    try {
      for (const frame of state.frames) {
        const original = imageCache.original.get(frame.id);
        if (!original) continue;

        const currentState = get();
        const processed = await processImageAsync({
          imageData: original,
          params: currentState.processingParams,
          palette: currentState.palette,
        });

        imageCache.processed.set(frame.id, processed);
      }
      set(state => ({ processedVersion: state.processedVersion + 1 }));
    } catch (error) {
      if ((error as Error).message !== 'Processing cancelled') {
        console.error('Processing failed:', error);
      }
    }

    set({ isProcessing: false });
  },
}));
