// Store ImageData outside of zustand/immer to avoid performance issues
// with large binary data in reactive state management

const originalCache = new Map<string, ImageData>();
const processedCache = new Map<string, ImageData>();

export function setOriginalImage(id: string, data: ImageData): void {
  originalCache.set(id, data);
}

export function getOriginalImage(id: string): ImageData | undefined {
  return originalCache.get(id);
}

export function setProcessedImage(id: string, data: ImageData): void {
  processedCache.set(id, data);
}

export function getProcessedImage(id: string): ImageData | undefined {
  return processedCache.get(id);
}

export function deleteFrameImages(id: string): void {
  originalCache.delete(id);
  processedCache.delete(id);
}

export function clearAllImages(): void {
  originalCache.clear();
  processedCache.clear();
}
