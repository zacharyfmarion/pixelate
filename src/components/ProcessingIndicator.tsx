import { useAppStore } from '../store/appStore';

export function ProcessingIndicator() {
  const isProcessing = useAppStore((s) => s.isProcessing);

  if (!isProcessing) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-[#1a1a2e] border-2 border-[#5c4a8a] px-4 py-2 shadow-[4px_4px_0_#0a0a12]">
      <span className="text-[#a89cc8] pixel-blink">▪ ▪ ▪</span>
      <span className="text-sm text-[#e8e4d9] uppercase tracking-wider">Processing...</span>
    </div>
  );
}
