export interface PixelateOptions {
  blockSize: number;
}

export function pixelate(
  imageData: ImageData,
  options: PixelateOptions
): ImageData {
  const { blockSize } = options;
  const { width, height, data } = imageData;

  const output = new ImageData(width, height);
  const outData = output.data;

  for (let blockY = 0; blockY < height; blockY += blockSize) {
    for (let blockX = 0; blockX < width; blockX += blockSize) {
      const bw = Math.min(blockSize, width - blockX);
      const bh = Math.min(blockSize, height - blockY);

      // Calculate average color for this block
      let r = 0,
        g = 0,
        b = 0,
        a = 0;
      const count = bw * bh;

      for (let py = 0; py < bh; py++) {
        for (let px = 0; px < bw; px++) {
          const idx = ((blockY + py) * width + (blockX + px)) * 4;
          r += data[idx];
          g += data[idx + 1];
          b += data[idx + 2];
          a += data[idx + 3];
        }
      }

      const avgR = Math.round(r / count);
      const avgG = Math.round(g / count);
      const avgB = Math.round(b / count);
      const avgA = Math.round(a / count);

      // Fill entire block with average color
      for (let py = 0; py < bh; py++) {
        for (let px = 0; px < bw; px++) {
          const idx = ((blockY + py) * width + (blockX + px)) * 4;
          outData[idx] = avgR;
          outData[idx + 1] = avgG;
          outData[idx + 2] = avgB;
          outData[idx + 3] = avgA;
        }
      }
    }
  }

  return output;
}
