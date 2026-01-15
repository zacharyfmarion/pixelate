import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { nanoid } from 'nanoid';
import { useAppStore } from '../store/appStore';
import { fileToImageData } from '../lib/utils/imageLoader';
import type { ImageFrame } from '../types';

export function ImageUploader() {
  const addFrames = useAppStore((s) => s.addFrames);
  const framesCount = useAppStore((s) => s.frames.length);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      // Sort files by name for consistent ordering
      const sortedFiles = [...acceptedFiles].sort((a, b) => a.name.localeCompare(b.name));

      const frames: ImageFrame[] = [];

      for (const file of sortedFiles) {
        try {
          const imageData = await fileToImageData(file);
          frames.push({
            id: nanoid(),
            name: file.name,
            original: imageData,
            processed: null,
            width: imageData.width,
            height: imageData.height,
          });
        } catch (error) {
          console.error(`Failed to load ${file.name}:`, error);
        }
      }

      if (frames.length > 0) {
        addFrames(frames);
      }
    },
    [addFrames]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
    },
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
        isDragActive
          ? 'border-indigo-500 bg-indigo-500/10'
          : 'border-gray-600 hover:border-gray-500 hover:bg-gray-800/50'
      }`}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-2">
        <svg
          className="w-8 h-8 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <div className="text-sm text-gray-300">
          {isDragActive ? (
            <span>Drop images here...</span>
          ) : (
            <span>
              Drag & drop images, or <span className="text-indigo-400">browse</span>
            </span>
          )}
        </div>
        {framesCount > 0 && (
          <div className="text-xs text-gray-500">{framesCount} image(s) loaded</div>
        )}
      </div>
    </div>
  );
}
