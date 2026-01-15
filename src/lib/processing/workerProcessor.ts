import type { RGB, ProcessingParams } from '../../types';

// Inline message types to avoid importing from worker file
interface ProcessRequest {
  type: 'process';
  requestId: number;
  imageBuffer: ArrayBuffer;
  width: number;
  height: number;
  params: ProcessingParams;
  palette: RGB[];
}

interface ProcessResponse {
  type: 'result';
  requestId: number;
  imageBuffer: ArrayBuffer;
  width: number;
  height: number;
}

// Create worker using Vite's worker import syntax
const createWorker = () => {
  return new Worker(
    new URL('../../workers/imageProcessor.worker.ts', import.meta.url),
    { type: 'module' }
  );
};

let worker: Worker | null = null;
let requestIdCounter = 0;
let currentRequestId: number | null = null;
let pendingResolve: ((result: ImageData) => void) | null = null;
let pendingReject: ((error: Error) => void) | null = null;

function getWorker(): Worker {
  if (!worker) {
    worker = createWorker();
    worker.onmessage = handleWorkerMessage;
    worker.onerror = handleWorkerError;
  }
  return worker;
}

function handleWorkerMessage(e: MessageEvent<ProcessResponse>) {
  const { requestId, imageBuffer, width, height } = e.data;

  // Ignore stale responses
  if (requestId !== currentRequestId) {
    return;
  }

  if (pendingResolve) {
    const data = new Uint8ClampedArray(imageBuffer);
    const imageData = new ImageData(data, width, height);
    pendingResolve(imageData);
    cleanup();
  }
}

function handleWorkerError(e: ErrorEvent) {
  if (pendingReject) {
    pendingReject(new Error(e.message));
    cleanup();
  }
}

function cleanup() {
  currentRequestId = null;
  pendingResolve = null;
  pendingReject = null;
}

export interface ProcessOptions {
  imageData: ImageData;
  params: ProcessingParams;
  palette: RGB[];
}

/**
 * Process an image in a Web Worker.
 * Automatically cancels any pending processing when called again.
 */
export function processImageAsync(options: ProcessOptions): Promise<ImageData> {
  const { imageData, params, palette } = options;

  // Cancel any pending request (the response will be ignored)
  currentRequestId = ++requestIdCounter;
  const thisRequestId = currentRequestId;

  return new Promise((resolve, reject) => {
    pendingResolve = resolve;
    pendingReject = reject;

    // Use setTimeout to allow the UI to update before we start the buffer copy
    // This prevents the page from appearing frozen during the copy
    setTimeout(() => {
      // Check if this request is still current
      if (thisRequestId !== currentRequestId) {
        return;
      }

      const w = getWorker();

      // Copy the image data buffer for transfer
      // This is necessary because we can't transfer the original buffer
      const buffer = imageData.data.buffer.slice(0);

      const request: ProcessRequest = {
        type: 'process',
        requestId: thisRequestId,
        imageBuffer: buffer,
        width: imageData.width,
        height: imageData.height,
        params,
        palette,
      };

      // Transfer the buffer to the worker (zero-copy after the initial copy)
      w.postMessage(request, [buffer]);
    }, 0);
  });
}

/**
 * Cancel any pending processing.
 * The next response from the worker will be ignored.
 */
export function cancelProcessing(): void {
  if (currentRequestId !== null) {
    currentRequestId = null;
    if (pendingReject) {
      pendingReject(new Error('Processing cancelled'));
    }
    cleanup();
  }
}

/**
 * Terminate the worker and clean up resources.
 */
export function terminateWorker(): void {
  if (worker) {
    worker.terminate();
    worker = null;
  }
  cleanup();
}
