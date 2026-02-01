import { useAppStore } from '../store/appStore';
import { Slider, Button, CollapsibleSection } from './ui';

export function AdjustmentsControls() {
  const adjustments = useAppStore((s) => s.processingParams.adjustments);
  const updateAdjustments = useAppStore((s) => s.updateAdjustments);
  const resetAdjustments = useAppStore((s) => s.resetAdjustments);
  const isProcessing = useAppStore((s) => s.isProcessing);

  const hasChanges =
    adjustments.brightness !== 0 ||
    adjustments.contrast !== 0 ||
    adjustments.saturation !== 0 ||
    adjustments.hue !== 0;

  return (
    <CollapsibleSection
      title="Adjustments"
      headerRight={
        hasChanges ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={resetAdjustments}
            disabled={isProcessing}
          >
            Reset
          </Button>
        ) : undefined
      }
    >
      <Slider
        label="Brightness"
        value={adjustments.brightness}
        min={-100}
        max={100}
        step={1}
        onChange={(brightness) => updateAdjustments({ brightness })}
        valueFormatter={(v) => (v > 0 ? `+${v}` : String(v))}
        disabled={isProcessing}
      />

      <Slider
        label="Contrast"
        value={adjustments.contrast}
        min={-100}
        max={100}
        step={1}
        onChange={(contrast) => updateAdjustments({ contrast })}
        valueFormatter={(v) => (v > 0 ? `+${v}` : String(v))}
        disabled={isProcessing}
      />

      <Slider
        label="Saturation"
        value={adjustments.saturation}
        min={-100}
        max={100}
        step={1}
        onChange={(saturation) => updateAdjustments({ saturation })}
        valueFormatter={(v) => (v > 0 ? `+${v}` : String(v))}
        disabled={isProcessing}
      />

      <Slider
        label="Hue"
        value={adjustments.hue}
        min={-180}
        max={180}
        step={1}
        onChange={(hue) => updateAdjustments({ hue })}
        valueFormatter={(v) => `${v}°`}
        disabled={isProcessing}
      />
    </CollapsibleSection>
  );
}
