import { useAppStore } from '../store/appStore';
import { Slider, Toggle, Select, CollapsibleSection } from './ui';

export function DitheringControls() {
  const dithering = useAppStore((s) => s.processingParams.dithering);
  const updateDithering = useAppStore((s) => s.updateDithering);
  const hasPalette = useAppStore((s) => s.palette.length > 0);
  const isProcessing = useAppStore((s) => s.isProcessing);

  if (!hasPalette) {
    return (
      <CollapsibleSection title="Dithering">
        <p className="text-xs text-[#5c5c8a] border border-dashed border-[#3d3d5c] p-2 bg-[#0a0a12]">
          Upload a color strip to enable dithering
        </p>
      </CollapsibleSection>
    );
  }

  return (
    <CollapsibleSection title="Dithering">
      <Toggle
        label="Enable"
        checked={dithering.enabled}
        onChange={(enabled) => updateDithering({ enabled })}
        disabled={isProcessing}
      />
      {dithering.enabled && (
        <>
          <Select
            label="Matrix Size"
            value={String(dithering.matrixSize)}
            options={[
              { value: '2', label: '2x2' },
              { value: '4', label: '4x4' },
              { value: '8', label: '8x8' },
            ]}
            onChange={(value) => updateDithering({ matrixSize: Number(value) as 2 | 4 | 8 })}
            disabled={isProcessing}
          />
          <Slider
            label="Strength"
            value={dithering.strength}
            min={0}
            max={1}
            step={0.05}
            onChange={(strength) => updateDithering({ strength })}
            valueFormatter={(v) => `${Math.round(v * 100)}%`}
            disabled={isProcessing}
          />
        </>
      )}
    </CollapsibleSection>
  );
}
