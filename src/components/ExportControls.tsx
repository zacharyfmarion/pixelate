import { useCallback } from 'react';
import { saveAs } from 'file-saver';
import { useAppStore } from '../store/appStore';
import { Button, Select, Slider, Toggle } from './ui';
import { exportToGif, exportToPng } from '../lib/export';

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
  const processingParams = useAppStore((s) => s.processingParams);
  
  const blockSize = processingParams.pixelation.blockSize;
  const pixelationEnabled = processingParams.pixelation.enabled;

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
          exportAtPixelSize: exportSettings.exportAtPixelSize,
          blockSize,
        });
        saveAs(blob, 'pixelated.gif');
      } else {
        await exportToPng(frames, {
          onProgress: setExportProgress,
          getProcessedImageData,
          getOriginalImageData,
          exportAtPixelSize: exportSettings.exportAtPixelSize,
          blockSize,
        });
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  }, [frames, exportSettings, processAllFrames, setIsExporting, setExportProgress, getProcessedImageData, getOriginalImageData, blockSize]);

  if (frames.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h3 className="text-xs text-[#7c6f9b] uppercase tracking-widest border-b border-[#3d3d5c] pb-1">› Export</h3>

      <Select
        label="Format"
        value={exportSettings.format}
        options={[
          { value: 'gif', label: frames.length === 1 ? 'GIF' : 'Animated GIF' },
          { value: 'png', label: frames.length === 1 ? 'PNG' : 'ZIP of PNGs' },
        ]}
        onChange={(value) => updateExportSettings({ format: value as 'gif' | 'png' })}
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

      {pixelationEnabled && blockSize > 1 && (
        <Toggle
          label="Export at pixel size"
          checked={exportSettings.exportAtPixelSize}
          onChange={(exportAtPixelSize) => updateExportSettings({ exportAtPixelSize })}
        />
      )}

      <Button
        onClick={handleExport}
        disabled={isExporting}
        className="w-full"
      >
        {isExporting ? (
          <span className="flex items-center gap-2">
            <span className="pixel-blink">◌</span>
            {Math.round(exportProgress * 100)}%
          </span>
        ) : (
          `Export ${frames.length > 1 ? `${frames.length} frames` : 'image'}`
        )}
      </Button>
    </div>
  );
}
