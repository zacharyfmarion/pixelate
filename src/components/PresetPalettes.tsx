import { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { extractPaletteFromStrip } from '../lib/processing/palette';

interface PresetPalette {
  id: string;
  name: string;
  file: string;
  previewColors: string[];
}

const PRESET_PALETTES: PresetPalette[] = [
  {
    id: 'resurrect-64',
    name: 'Resurrect 64',
    file: '/palettes/resurrect-64-1x.png',
    previewColors: ['#2e222f', '#3e3546', '#625565', '#966c6c', '#ab947a', '#694f62', '#7f708a', '#9babb2', '#c7dcd0', '#ffffff'],
  },
  {
    id: 'slso8',
    name: 'SLSO8',
    file: '/palettes/slso8-1x.png',
    previewColors: ['#0d2b45', '#203c56', '#544e68', '#8d697a', '#d08159', '#ffaa5e', '#ffd4a3', '#ffecd6'],
  },
  {
    id: 'twilight-5',
    name: 'Twilight 5',
    file: '/palettes/twilight-5-1x.png',
    previewColors: ['#fbbbad', '#ee8695', '#4a7a96', '#333f58', '#292831'],
  },
];

export function PresetPalettes() {
  const setPalette = useAppStore((s) => s.setPalette);
  const [selectedId, setSelectedId] = useState<string | null>('none');
  const [loading, setLoading] = useState<string | null>(null);

  const clearPalette = () => {
    setPalette([]);
    setSelectedId('none');
  };

  const loadPalette = async (preset: PresetPalette) => {
    setLoading(preset.id);
    try {
      const response = await fetch(preset.file);
      const blob = await response.blob();

      const img = new Image();
      const url = URL.createObjectURL(blob);

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = url;
      });

      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, img.width, img.height);
      URL.revokeObjectURL(url);

      const colors = extractPaletteFromStrip(imageData);
      setPalette(colors);
      setSelectedId(preset.id);
    } catch (error) {
      console.error('Failed to load preset palette:', error);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-1">
      {/* None option */}
      <button
        onClick={clearPalette}
        className={`w-full px-2 py-1 border-2 transition-all text-left cursor-pointer flex items-center gap-2 ${
          selectedId === 'none'
            ? 'border-[#a89cc8] bg-[#5c4a8a]/30'
            : 'border-[#3d3d5c] bg-[#2d2d44] hover:border-[#5c5c8a]'
        }`}
      >
        <span className="text-xs text-[#b8b4a9] whitespace-nowrap">None</span>
        <div className="flex-1 h-3 bg-[#1a1a2e] border border-[#3d3d5c]" />
      </button>

      {/* Preset Palettes */}
      {PRESET_PALETTES.map((preset) => (
        <button
          key={preset.id}
          onClick={() => loadPalette(preset)}
          disabled={loading !== null}
          className={`w-full px-2 py-1 border-2 transition-all text-left cursor-pointer flex items-center gap-2 ${
            selectedId === preset.id
              ? 'border-[#a89cc8] bg-[#5c4a8a]/30'
              : 'border-[#3d3d5c] bg-[#2d2d44] hover:border-[#5c5c8a]'
          } ${loading === preset.id ? 'opacity-50' : ''}`}
        >
          <span className="text-xs text-[#b8b4a9] whitespace-nowrap min-w-[70px]">
            {loading === preset.id ? '...' : preset.name}
          </span>
          <div className="flex flex-1 h-3 overflow-hidden border border-[#3d3d5c]">
            {preset.previewColors.map((color, i) => (
              <div
                key={i}
                className="flex-1 h-full"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </button>
      ))}
    </div>
  );
}
