import { extract, IImage, Channels } from 'colorgram';

/**
 * Converts an RGB color value to a HEX string.
 */
function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((x) => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      })
      .join('')
  );
}

/**
 * Extracts dominant colors from an image file
 * @param imageData The image data as Uint8Array
 * @param numColors Number of colors to extract (default: 12)
 * @returns Array of colors with RGB values, hex string, and proportion
 */
export function extractColors(imageData: Uint8Array, numColors: number = 12) {
  const image: IImage = {
    data: imageData,
    channels: Channels.RGB,
  };

  const colors = extract(image, numColors);

  // Transform the raw color data, calculate hex
  return colors.map((color) => {
    const r = color[0];
    const g = color[1];
    const b = color[2];
    const proportion = color[3];
    const hex = rgbToHex(r, g, b);

    return {
      rgb: {
        r,
        g,
        b,
      },
      hex: hex,
      proportion: proportion,
    };
  });
}
