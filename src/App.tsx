import { ImageUploader } from './components/ImageUploader';
import { ColorStripUploader } from './components/ColorStripUploader';
import { PresetPalettes } from './components/PresetPalettes';
import { PaletteDisplay } from './components/PaletteDisplay';
import { PreviewCanvas } from './components/PreviewCanvas';
import { AdjustmentsControls } from './components/AdjustmentsControls';
import { PixelationControls } from './components/PixelationControls';
import { DitheringControls } from './components/DitheringControls';
import { SequencePlayer } from './components/SequencePlayer';
import { ExportControls } from './components/ExportControls';
import { ProcessingIndicator } from './components/ProcessingIndicator';
import { useImageProcessor } from './hooks/useImageProcessor';

function App() {
  useImageProcessor();

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <ProcessingIndicator />
      {/* Header */}
      <header className="flex-shrink-0 px-4 py-3 border-b-2 border-[#3d3d5c] bg-[#1a1a2e]">
        <h1 className="text-xl text-[#a89cc8] uppercase tracking-widest">
          ✦ Pixelate ✦
        </h1>
        <p className="text-xs text-[#5c5c8a] uppercase tracking-wider">
          Apply pixelation, dithering, and color palette effects
        </p>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar */}
        <aside className="w-72 flex-shrink-0 border-r-2 border-[#3d3d5c] bg-[#1a1a2e] overflow-y-auto">
          <div className="p-4 space-y-6">
            <section>
              <h2 className="text-xs text-[#7c6f9b] uppercase tracking-widest mb-3 border-b border-[#3d3d5c] pb-1">
                › Images
              </h2>
              <ImageUploader />
            </section>

            <section>
              <h2 className="text-xs text-[#7c6f9b] uppercase tracking-widest mb-3 border-b border-[#3d3d5c] pb-1">
                › Color Palette
              </h2>
              <div className="space-y-4">
                <PresetPalettes />
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t-2 border-dashed border-[#3d3d5c]" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="px-2 bg-[#1a1a2e] text-xs text-[#5c5c8a]">or upload</span>
                  </div>
                </div>
                <ColorStripUploader />
                <PaletteDisplay />
              </div>
            </section>

            <SequencePlayer />
          </div>
        </aside>

        {/* Canvas area */}
        <main className="flex-1 flex flex-col p-4 overflow-hidden bg-[#0a0a12]">
          <PreviewCanvas />
        </main>

        {/* Right sidebar */}
        <aside className="w-72 flex-shrink-0 border-l-2 border-[#3d3d5c] bg-[#1a1a2e] overflow-y-auto">
          <div className="p-4 space-y-6">
            <section>
              <h2 className="text-xs text-[#7c6f9b] uppercase tracking-widest mb-3 border-b border-[#3d3d5c] pb-1">
                › Effects
              </h2>
              <div className="space-y-6">
                <AdjustmentsControls />
                <PixelationControls />
                <DitheringControls />
              </div>
            </section>

            <section>
              <ExportControls />
            </section>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default App;
