import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useAppStore } from '../store/appStore';
import { fileToImageData } from '../lib/utils/imageLoader';

export function ColorStripUploader() {
  const setColorStrip = useAppStore((s) => s.setColorStrip);
  const paletteLength = useAppStore((s) => s.palette.length);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      try {
        const imageData = await fileToImageData(file);
        setColorStrip(imageData);
      } catch (error) {
        console.error('Failed to load color strip:', error);
      }
    },
    [setColorStrip]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
    },
    maxFiles: 1,
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
        isDragActive
          ? 'border-indigo-500 bg-indigo-500/10'
          : 'border-gray-600 hover:border-gray-500 hover:bg-gray-800/50'
      }`}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-1">
        <svg
          className="w-6 h-6 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
          />
        </svg>
        <div className="text-xs text-gray-300">
          {isDragActive ? 'Drop color strip...' : 'Upload color strip'}
        </div>
        {paletteLength > 0 && (
          <div className="text-xs text-gray-500">{paletteLength} colors</div>
        )}
      </div>
    </div>
  );
}
