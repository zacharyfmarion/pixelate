import { useCallback } from 'react';
import { saveAs } from 'file-saver';
import { useAppStore } from '../store/appStore';
import { Button, Select, Slider, Toggle } from './ui';
import { exportToGif, exportToZip } from '../lib/export';

export function ExportControls() {
  const frames = useAppStore((s) => s.frames);
  const exportSettings = useAppStore((s) => s.exportSettings);
  const updateExportSettings = useAppStore((s) => s.updateExportSettings);
  const isExporting = useAppStore((s) => s.isExporting);
  const exportProgress = useAppStore((s) => s.exportProgress);
  const setIsExporting = useAppStore((s) => s.setIsExporting);
  const setExportProgress = useAppStore((s) => s.setExportProgress);
  const processAllFrames = useAppStore((s) => s.processAllFrames);
  const getOriginalImageData = useAppStore((s) => s.getOriginalImageData);
  const getProcessedImageData = useAppStore((s) => s.getProcessedImageData);

  const handleExport = useCallback(async () => {
    if (frames.length === 0) return;

    setIsExporting(true);
    setExportProgress(0);

    try {
      // Process all frames first
      await processAllFrames();

      if (exportSettings.format === 'gif') {
        const blob = await exportToGif(frames, {
          delay: exportSettings.gifDelay,
          loop: exportSettings.gifLoop,
          quality: exportSettings.quality,
          onProgress: setExportProgress,
          getProcessedImageData,
          getOriginalImageData,
        });
        saveAs(blob, 'pixelated.gif');
      } else {
        await exportToZip(frames, {
          onProgress: setExportProgress,
          getProcessedImageData,
          getOriginalImageData,
        });
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  }, [frames, exportSettings, processAllFrames, setIsExporting, setExportProgress, getProcessedImageData, getOriginalImageData]);

  if (frames.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-gray-200">Export</h3>

      <Select
        label="Format"
        value={exportSettings.format}
        options={[
          { value: 'gif', label: 'Animated GIF' },
          { value: 'zip', label: 'ZIP of PNGs' },
        ]}
        onChange={(value) => updateExportSettings({ format: value as 'gif' | 'zip' })}
      />

      {exportSettings.format === 'gif' && (
        <>
          <Slider
            label="Frame Delay"
            value={exportSettings.gifDelay}
            min={20}
            max={500}
            step={10}
            onChange={(gifDelay) => updateExportSettings({ gifDelay })}
            valueFormatter={(v) => `${v}ms`}
          />
          <Toggle
            label="Loop"
            checked={exportSettings.gifLoop}
            onChange={(gifLoop) => updateExportSettings({ gifLoop })}
          />
          <Slider
            label="Quality"
            value={exportSettings.quality}
            min={1}
            max={20}
            step={1}
            onChange={(quality) => updateExportSettings({ quality })}
            valueFormatter={(v) => `${21 - v}`}
          />
        </>
      )}

      <Button
        onClick={handleExport}
        disabled={isExporting}
        className="w-full"
      >
        {isExporting ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            {Math.round(exportProgress * 100)}%
          </span>
        ) : (
          `Export ${frames.length > 1 ? `${frames.length} frames` : 'image'}`
        )}
      </Button>
    </div>
  );
}
