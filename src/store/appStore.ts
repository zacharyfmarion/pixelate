import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { RGB, ImageFrame, ProcessingParams, ExportSettings } from '../types';
import { extractPaletteFromStrip } from '../lib/processing/palette';
import { processImage } from '../lib/processing/pipeline';

interface AppState {
  // Images
  frames: ImageFrame[];
  currentFrameIndex: number;
  isProcessing: boolean;

  // Palette
  palette: RGB[];
  colorStripImage: ImageData | null;

  // Processing parameters
  processingParams: ProcessingParams;

  // Export
  exportSettings: ExportSettings;
  isExporting: boolean;
  exportProgress: number;

  // Actions
  addFrames: (frames: ImageFrame[]) => void;
  removeFrame: (id: string) => void;
  clearFrames: () => void;
  setCurrentFrame: (index: number) => void;

  setColorStrip: (imageData: ImageData | null) => void;
  setPalette: (colors: RGB[]) => void;
  addPaletteColor: (color: RGB) => void;
  removePaletteColor: (index: number) => void;

  updatePixelation: (params: Partial<ProcessingParams['pixelation']>) => void;
  updateDithering: (params: Partial<ProcessingParams['dithering']>) => void;

  updateExportSettings: (settings: Partial<ExportSettings>) => void;
  setExportProgress: (progress: number) => void;
  setIsExporting: (isExporting: boolean) => void;

  processCurrentFrame: () => void;
  processAllFrames: () => Promise<void>;
}

const initialProcessingParams: ProcessingParams = {
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

export const useAppStore = create<AppState>()(
  immer((set, get) => ({
    // Initial state
    frames: [],
    currentFrameIndex: 0,
    isProcessing: false,
    palette: [],
    colorStripImage: null,
    processingParams: initialProcessingParams,
    exportSettings: {
      format: 'gif',
      gifDelay: 100,
      gifLoop: true,
      quality: 10,
    },
    isExporting: false,
    exportProgress: 0,

    // Frame actions
    addFrames: (newFrames) =>
      set((state) => {
        state.frames.push(...newFrames);
      }),

    removeFrame: (id) =>
      set((state) => {
        state.frames = state.frames.filter((f) => f.id !== id);
        if (state.currentFrameIndex >= state.frames.length) {
          state.currentFrameIndex = Math.max(0, state.frames.length - 1);
        }
      }),

    clearFrames: () =>
      set((state) => {
        state.frames = [];
        state.currentFrameIndex = 0;
      }),

    setCurrentFrame: (index) =>
      set((state) => {
        state.currentFrameIndex = index;
      }),

    // Palette actions
    setColorStrip: (imageData) =>
      set((state) => {
        state.colorStripImage = imageData;
        if (imageData) {
          state.palette = extractPaletteFromStrip(imageData);
        }
      }),

    setPalette: (colors) =>
      set((state) => {
        state.palette = colors;
      }),

    addPaletteColor: (color) =>
      set((state) => {
        state.palette.push(color);
      }),

    removePaletteColor: (index) =>
      set((state) => {
        state.palette.splice(index, 1);
      }),

    // Processing param actions
    updatePixelation: (params) =>
      set((state) => {
        Object.assign(state.processingParams.pixelation, params);
      }),

    updateDithering: (params) =>
      set((state) => {
        Object.assign(state.processingParams.dithering, params);
      }),

    // Export actions
    updateExportSettings: (settings) =>
      set((state) => {
        Object.assign(state.exportSettings, settings);
      }),

    setExportProgress: (progress) =>
      set((state) => {
        state.exportProgress = progress;
      }),

    setIsExporting: (isExporting) =>
      set((state) => {
        state.isExporting = isExporting;
      }),

    // Processing actions
    processCurrentFrame: () => {
      const state = get();
      const frame = state.frames[state.currentFrameIndex];
      if (!frame) return;

      set({ isProcessing: true });

      const processed = processImage(frame.original, {
        ...state.processingParams,
        palette: state.palette,
      });

      set((s) => {
        const idx = s.currentFrameIndex;
        if (s.frames[idx]) {
          s.frames[idx].processed = processed;
        }
        s.isProcessing = false;
      });
    },

    processAllFrames: async () => {
      const state = get();
      set({ isProcessing: true });

      for (let i = 0; i < state.frames.length; i++) {
        const frame = state.frames[i];
        const processed = processImage(frame.original, {
          ...state.processingParams,
          palette: state.palette,
        });

        set((s) => {
          if (s.frames[i]) {
            s.frames[i].processed = processed;
          }
        });

        // Allow UI to update
        await new Promise((r) => setTimeout(r, 0));
      }

      set({ isProcessing: false });
    },
  }))
);
