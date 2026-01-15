import { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { extractPaletteFromStrip } from '../lib/processing/palette';

interface PresetPalette {
  id: string;
  name: string;
  file: string;
}

const PRESET_PALETTES: PresetPalette[] = [
  { id: 'cozy-64', name: 'Cozy 64', file: '/palettes/cozy-palette-64.png' },
  { id: 'resurrect-64', name: 'Resurrect 64', file: '/palettes/resurrect-64-1x.png' },
  { id: 'slso8', name: 'SLSO8', file: '/palettes/slso8-1x.png' },
  { id: 'twilight-5', name: 'Twilight 5', file: '/palettes/twilight-5-1x.png' },
];

export function PresetPalettes() {
  const setPalette = useAppStore((s) => s.setPalette);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

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
    <div className="space-y-2">
      <label className="text-xs text-gray-400">Preset Palettes</label>
      <div className="grid grid-cols-2 gap-2">
        {PRESET_PALETTES.map((preset) => (
          <button
            key={preset.id}
            onClick={() => loadPalette(preset)}
            disabled={loading !== null}
            className={`px-3 py-2 text-xs rounded-lg border transition-colors text-left ${
              selectedId === preset.id
                ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300'
                : 'border-gray-600 bg-gray-800 text-gray-300 hover:border-gray-500 hover:bg-gray-700'
            } ${loading === preset.id ? 'opacity-50' : ''}`}
          >
            {loading === preset.id ? 'Loading...' : preset.name}
          </button>
        ))}
      </div>
    </div>
  );
}
