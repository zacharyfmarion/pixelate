import { useAppStore } from '../store/appStore';
import { Button } from './ui';

export function PaletteDisplay() {
  const palette = useAppStore((s) => s.palette);
  const removePaletteColor = useAppStore((s) => s.removePaletteColor);
  const setPalette = useAppStore((s) => s.setPalette);

  if (palette.length === 0) {
    return (
      <div className="text-xs text-gray-500 text-center py-2">
        Upload a color strip to extract colors
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">{palette.length} colors</span>
        <Button variant="ghost" size="sm" onClick={() => setPalette([])}>
          Clear
        </Button>
      </div>
      <div className="flex flex-wrap gap-1">
        {palette.map((color, index) => (
          <button
            key={index}
            onClick={() => removePaletteColor(index)}
            className="w-6 h-6 rounded border border-gray-600 hover:border-red-500 hover:scale-110 transition-transform"
            style={{ backgroundColor: `rgb(${color.r}, ${color.g}, ${color.b})` }}
            title={`RGB(${color.r}, ${color.g}, ${color.b}) - Click to remove`}
          />
        ))}
      </div>
    </div>
  );
}
