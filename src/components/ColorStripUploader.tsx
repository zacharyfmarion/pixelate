import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useAppStore } from '../store/appStore';
import { fileToImageData } from '../lib/utils/imageLoader';
import { parsePaletteFile } from '../lib/utils/paletteFiles';

export function ColorStripUploader() {
  const setColorStrip = useAppStore((s) => s.setColorStrip);
  const setPalette = useAppStore((s) => s.setPalette);
  const paletteLength = useAppStore((s) => s.palette.length);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      const ext = file.name.toLowerCase().split('.').pop();

      try {
        // Handle palette files (GPL, JSON)
        if (ext === 'gpl' || ext === 'json') {
          const content = await file.text();
          const colors = parsePaletteFile(content, file.name);
          if (colors.length > 0) {
            setPalette(colors);
          } else {
            console.error('No colors found in palette file');
          }
          return;
        }

        // Handle image files (PNG, etc.)
        const imageData = await fileToImageData(file);
        setColorStrip(imageData);
      } catch (error) {
        console.error('Failed to load palette:', error);
      }
    },
    [setColorStrip, setPalette]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
      'text/plain': ['.gpl'],
      'application/json': ['.json'],
    },
    maxFiles: 1,
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed p-4 text-center cursor-pointer transition-all ${
        isDragActive
          ? 'border-[#a89cc8] bg-[#5c4a8a]/20'
          : 'border-[#3d3d5c] hover:border-[#5c5c8a] hover:bg-[#2d2d44]/50'
      }`}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-1">
        <div className="text-lg text-[#7c6f9b]">◈</div>
        <div className="text-xs text-[#b8b4a9]">
          {isDragActive ? 'Drop palette file...' : 'Upload palette'}
        </div>
        <div className="text-[10px] text-[#5c5c8a]">
          PNG, GPL, JSON
        </div>
        {paletteLength > 0 && (
          <div className="text-xs text-[#5c5c8a]">{paletteLength} colors loaded</div>
        )}
      </div>
    </div>
  );
}
