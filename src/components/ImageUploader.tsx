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
      className={`border-2 border-dashed p-6 text-center cursor-pointer transition-all ${
        isDragActive
          ? 'border-[#a89cc8] bg-[#5c4a8a]/20'
          : 'border-[#3d3d5c] hover:border-[#5c5c8a] hover:bg-[#2d2d44]/50'
      }`}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-2">
        <div className="text-2xl text-[#7c6f9b]">⬡</div>
        <div className="text-sm text-[#b8b4a9]">
          {isDragActive ? (
            <span>Drop images here...</span>
          ) : (
            <span>
              Drag & drop images, or <span className="text-[#a89cc8]">browse</span>
            </span>
          )}
        </div>
        {framesCount > 0 && (
          <div className="text-xs text-[#5c5c8a]">{framesCount} image(s) loaded</div>
        )}
      </div>
    </div>
  );
}
