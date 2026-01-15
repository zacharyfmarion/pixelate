import { ImageUploader } from './components/ImageUploader';
import { ColorStripUploader } from './components/ColorStripUploader';
import { PaletteDisplay } from './components/PaletteDisplay';
import { PreviewCanvas } from './components/PreviewCanvas';
import { PixelationControls } from './components/PixelationControls';
import { DitheringControls } from './components/DitheringControls';
import { SequencePlayer } from './components/SequencePlayer';
import { ExportControls } from './components/ExportControls';
import { useImageProcessor } from './hooks/useImageProcessor';

function App() {
  useImageProcessor();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex-shrink-0 px-4 py-3 border-b border-gray-800 bg-gray-900">
        <h1 className="text-lg font-semibold text-gray-100">Pixelate</h1>
        <p className="text-xs text-gray-500">
          Apply pixelation, dithering, and color palette effects
        </p>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar */}
        <aside className="w-72 flex-shrink-0 border-r border-gray-800 bg-gray-900 overflow-y-auto">
          <div className="p-4 space-y-6">
            <section>
              <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
                Images
              </h2>
              <ImageUploader />
            </section>

            <section>
              <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
                Color Palette
              </h2>
              <div className="space-y-3">
                <ColorStripUploader />
                <PaletteDisplay />
              </div>
            </section>

            <SequencePlayer />
          </div>
        </aside>

        {/* Canvas area */}
        <main className="flex-1 flex flex-col p-4 overflow-hidden">
          <PreviewCanvas />
        </main>

        {/* Right sidebar */}
        <aside className="w-72 flex-shrink-0 border-l border-gray-800 bg-gray-900 overflow-y-auto">
          <div className="p-4 space-y-6">
            <section>
              <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
                Effects
              </h2>
              <div className="space-y-6">
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
