# ✦ Pixelate ✦

A browser-based image processing tool for applying pixelation, dithering, and color palette effects to images. Create retro-style pixel art from any image with real-time preview and export capabilities.

![Pixelate](https://img.shields.io/badge/Made%20with-React-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)

![Pixelate Screenshot](screenshot.png)

## Features

- **Image Upload**: Drag and drop or click to upload images
- **Color Palettes**: Choose from preset palettes or upload your own color strip
- **Pixelation**: Adjustable pixel size for different retro effects
- **Dithering**: Multiple dithering algorithms (Floyd-Steinberg, Ordered, etc.)
- **Adjustments**: Brightness, contrast, and saturation controls
- **Sequence Support**: Process multiple images as a sequence
- **Export Options**: Export as PNG or animated GIF
- **Real-time Preview**: See changes instantly with Web Worker-powered processing

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (v1.0 or higher)

### Installation

```bash
# Clone the repository
git clone https://github.com/zacharyfmarion/pixelate.git
cd pixelate

# Install dependencies
bun install

# Start the development server
bun dev
```

The app will be available at `http://localhost:5173`.

### Building for Production

```bash
bun run build
```

The built files will be in the `dist` directory.

## Usage

1. **Upload an image** using the left sidebar
2. **Select a color palette** from the presets or upload your own
3. **Adjust effects** in the right sidebar:
   - Pixelation size
   - Dithering algorithm and strength
   - Brightness, contrast, and saturation
4. **Preview** your changes in real-time
5. **Export** as PNG or GIF

## Tech Stack

- [React 19](https://react.dev/) - UI framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Vite](https://vitejs.dev/) - Build tool
- [Bun](https://bun.sh/) - JavaScript runtime & package manager
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Zustand](https://zustand-demo.pmnd.rs/) - State management
- [Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API) - Background image processing
- [gif.js](https://jnordberg.github.io/gif.js/) - GIF encoding

## Project Structure

```
src/
├── components/       # React components
│   ├── ui/          # Reusable UI components
│   └── ...          # Feature components
├── hooks/           # Custom React hooks
├── lib/
│   ├── export/      # Export functionality (PNG, GIF)
│   ├── processing/  # Image processing algorithms
│   └── utils/       # Utility functions
├── store/           # Zustand store
├── types/           # TypeScript type definitions
└── workers/         # Web Worker for image processing
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Preset palettes from [Lospec](https://lospec.com/palette-list)
- [gif.js](https://github.com/jnordberg/gif.js) for GIF encoding
