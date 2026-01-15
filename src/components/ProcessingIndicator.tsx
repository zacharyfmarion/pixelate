import { useAppStore } from '../store/appStore';

export function ProcessingIndicator() {
  const isProcessing = useAppStore((s) => s.isProcessing);

  if (!isProcessing) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 shadow-lg">
      <svg
        className="animate-spin h-4 w-4 text-indigo-500"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      <span className="text-sm text-gray-300">Processing...</span>
    </div>
  );
}
