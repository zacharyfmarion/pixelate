import { useAppStore } from '../store/appStore';
import { Slider, Toggle } from './ui';

export function PixelationControls() {
  const pixelation = useAppStore((s) => s.processingParams.pixelation);
  const updatePixelation = useAppStore((s) => s.updatePixelation);
  const isProcessing = useAppStore((s) => s.isProcessing);

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-gray-200">Pixelation</h3>
      <Toggle
        label="Enable"
        checked={pixelation.enabled}
        onChange={(enabled) => updatePixelation({ enabled })}
        disabled={isProcessing}
      />
      {pixelation.enabled && (
        <Slider
          label="Block Size"
          value={pixelation.blockSize}
          min={2}
          max={64}
          step={1}
          onChange={(blockSize) => updatePixelation({ blockSize })}
          valueFormatter={(v) => `${v}px`}
          disabled={isProcessing}
        />
      )}
    </div>
  );
}
