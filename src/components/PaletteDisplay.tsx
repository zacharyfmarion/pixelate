import { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { Button } from './ui';
import type { RGB } from '../types';
import {
  exportAsGPL,
  exportAsPNG,
  downloadFile,
} from '../lib/utils/paletteFiles';

// Convert hex color to RGB
function hexToRgb(hex: string): RGB {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}

export function PaletteDisplay() {
  const palette = useAppStore((s) => s.palette);
  const setPalette = useAppStore((s) => s.setPalette);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pickerColor, setPickerColor] = useState('#7c6f9b');
  const [showExportMenu, setShowExportMenu] = useState(false);

  const handleExportGPL = () => {
    const content = exportAsGPL(palette);
    downloadFile(content, 'palette.gpl', 'text/plain');
    setShowExportMenu(false);
  };

  const handleExportPNG = () => {
    const blob = exportAsPNG(palette);
    downloadFile(blob, 'palette.png');
    setShowExportMenu(false);
  };

  const removePaletteColor = (index: number) => {
    setPalette(palette.filter((_, i) => i !== index));
  };

  const addColor = (hexColor: string) => {
    const rgb = hexToRgb(hexColor);
    // Check if color already exists
    const exists = palette.some(
      (c) => c.r === rgb.r && c.g === rgb.g && c.b === rgb.b
    );
    if (!exists) {
      setPalette([...palette, rgb]);
    }
  };

  const handleConfirmColor = () => {
    addColor(pickerColor);
    setIsPickerOpen(false);
  };

  const handleCancel = () => {
    setIsPickerOpen(false);
  };

  // Inline color picker panel JSX (not a nested component to avoid remounting)
  const colorPickerPanel = (
    <div className="p-2 border-2 border-[#5c5c8a] bg-[#1a1a2e] space-y-2">
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={pickerColor}
          onChange={(e) => setPickerColor(e.target.value)}
          className="w-10 h-10 border-2 border-[#3d3d5c] cursor-pointer bg-transparent"
        />
        <div className="flex-1">
          <div
            className="h-10 border-2 border-[#3d3d5c]"
            style={{ backgroundColor: pickerColor }}
          />
        </div>
        <input
          type="text"
          value={pickerColor.toUpperCase()}
          onChange={(e) => {
            const val = e.target.value;
            if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
              setPickerColor(val);
            }
          }}
          className="w-20 px-2 py-1 bg-[#0a0a12] border-2 border-[#3d3d5c] text-xs text-[#e8e4d9] font-mono text-center focus:border-[#a89cc8] focus:outline-none"
          maxLength={7}
        />
      </div>
      <div className="flex gap-2">
        <Button
          variant="primary"
          size="sm"
          onClick={handleConfirmColor}
          className="flex-1"
        >
          Add
        </Button>
        <Button variant="ghost" size="sm" onClick={handleCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );

  if (palette.length === 0) {
    return (
      <div className="space-y-2">
        <div className="text-xs text-[#5c5c8a] text-center py-2 border border-dashed border-[#3d3d5c] bg-[#0a0a12]">
          Upload a color strip or add colors manually
        </div>
        {isPickerOpen ? (
          colorPickerPanel
        ) : (
          <button
            onClick={() => setIsPickerOpen(true)}
            className="w-full py-2 border-2 border-dashed border-[#3d3d5c] bg-[#1a1a2e] hover:border-[#5c5c8a] hover:bg-[#2d2d44] text-xs text-[#7c6f9b] uppercase tracking-wider transition-colors cursor-pointer"
          >
            + Add Color
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-[#7c6f9b]">{palette.length} colors</span>
        <div className="flex items-center gap-1">
          {/* Export dropdown */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowExportMenu(!showExportMenu)}
            >
              Export ▾
            </Button>
            {showExportMenu && (
              <div className="absolute right-0 top-full mt-1 z-10 bg-[#1a1a2e] border-2 border-[#3d3d5c] min-w-[120px]">
                <button
                  onClick={handleExportGPL}
                  className="w-full px-3 py-1.5 text-left text-xs text-[#b8b4a9] hover:bg-[#2d2d44] cursor-pointer"
                >
                  GPL (GIMP)
                </button>
                <button
                  onClick={handleExportPNG}
                  className="w-full px-3 py-1.5 text-left text-xs text-[#b8b4a9] hover:bg-[#2d2d44] cursor-pointer"
                >
                  PNG Strip
                </button>
              </div>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={() => setPalette([])}>
            Clear
          </Button>
        </div>
      </div>
      <div className="flex flex-wrap gap-1 p-2 bg-[#0a0a12] border border-[#3d3d5c]">
        {palette.map((color, index) => (
          <button
            key={index}
            onClick={() => removePaletteColor(index)}
            className="w-6 h-6 border-2 border-[#3d3d5c] hover:border-[#ff6b6b] hover:scale-110 transition-transform cursor-pointer"
            style={{ backgroundColor: `rgb(${color.r}, ${color.g}, ${color.b})` }}
            title={`RGB(${color.r}, ${color.g}, ${color.b}) - Click to remove`}
          />
        ))}
        {/* Add color button */}
        {!isPickerOpen && (
          <button
            onClick={() => setIsPickerOpen(true)}
            className="w-6 h-6 border-2 border-dashed border-[#5c5c8a] bg-[#1a1a2e] hover:border-[#a89cc8] hover:bg-[#2d2d44] flex items-center justify-center text-[#7c6f9b] hover:text-[#a89cc8] transition-colors cursor-pointer"
            title="Add new color"
          >
            <span className="text-sm leading-none">+</span>
          </button>
        )}
      </div>
      {isPickerOpen && colorPickerPanel}
    </div>
  );
}
