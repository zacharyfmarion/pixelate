import { useAppStore } from '../store/appStore';
import { Slider, Toggle, CollapsibleSection } from './ui';

export function PixelationControls() {
  const pixelation = useAppStore((s) => s.processingParams.pixelation);
  const updatePixelation = useAppStore((s) => s.updatePixelation);
  const isProcessing = useAppStore((s) => s.isProcessing);

  return (
    <CollapsibleSection title="Pixelation">
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
    </CollapsibleSection>
  );
}
