import { GoogleGenerativeAI, Part } from '@google/generative-ai';
import { encodeBase64 } from 'https://deno.land/std@0.224.0/encoding/base64.ts';
import { extname } from 'https://deno.land/std@0.224.0/path/mod.ts';
import { extractColors } from './extractColors.ts';
import { z } from 'https://deno.land/x/zod@v3.23.8/mod.ts';

// Schema for the basic validated analysis response
const imageAnalysisSchema = z.object({
  analysis: z
    .string()
    .min(1, { message: 'Image analysis text cannot be empty.' }),
});

// Type alias for the schema
type ImageAnalysisResponse = z.infer<typeof imageAnalysisSchema>;

// Converts local file information to a GenerativePart object
function fileToGenerativePart(filePath: string): Part {
  const mimeType = getMimeType(filePath);
  if (!mimeType) {
    throw new Error(`Could not determine mime type for file: ${filePath}`);
  }
  return {
    inlineData: {
      data: encodeBase64(Deno.readFileSync(filePath)),
      mimeType,
    },
  };
}

// Basic function to determine mime type from file extension
function getMimeType(filePath: string): string | undefined {
  const ext = extname(filePath).toLowerCase();
  switch (ext) {
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.webp':
      return 'image/webp';
    // Add more mime types as needed
    default:
      return undefined;
  }
}

/**
 * Generates a color palette image from extracted colors and saves it to the filesystem
 * @param colors Array of extracted colors
 * @param outputPath Path to save the palette image
 */
async function generateAndSavePalette(
  colors: any[],
  outputPath: string,
): Promise<void> {
  // Create a canvas with rectangles for each color
  const width = 500;
  const height = 100;
  const canvas = new Uint8Array(width * height * 4); // RGBA format

  const numColors = colors.length;
  const rectWidth = width / numColors;

  // Fill the canvas with color rectangles
  for (let i = 0; i < numColors; i++) {
    const color = colors[i];
    const startX = Math.floor(i * rectWidth);
    const endX = Math.floor((i + 1) * rectWidth);

    // Fill this rectangle with the color
    for (let y = 0; y < height; y++) {
      for (let x = startX; x < endX; x++) {
        const idx = (y * width + x) * 4;
        canvas[idx] = color.rgb.r; // R
        canvas[idx + 1] = color.rgb.g; // G
        canvas[idx + 2] = color.rgb.b; // B
        canvas[idx + 3] = 255; // A (fully opaque)
      }
    }
  }

  // Save the canvas as a PNG file
  await Deno.writeFile(outputPath, canvas);
  console.log(`Color palette saved to ${outputPath}`);
}

/**
 * Analyzes an image using the Gemini API.
 * @param apiKey The Google Generative AI API key.
 * @param imagePath The path to the image file.
 * @param prompt The prompt to use for analysis.
 * @returns A validated analysis object.
 */
export async function analyzeImage(
  apiKey: string,
  imagePath: string,
  prompt: string,
): Promise<ImageAnalysisResponse> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

  // Extract colors from the image
  const imageData = Deno.readFileSync(imagePath);
  const colors = extractColors(imageData);

  // Generate and save color palette
  const paletteOutputPath = `${imagePath.split('.')[0]}_palette.png`;
  await generateAndSavePalette(colors, paletteOutputPath);

  const imagePart = fileToGenerativePart(imagePath);

  try {
    const result = await model.generateContent([prompt, imagePart]);
    const response = result.response;
    const responseText = response.text();

    // Validate and return the structured response
    return imageAnalysisSchema.parse({ analysis: responseText });
  } catch (error) {
    // Check for ZodError first
    if (error instanceof z.ZodError) {
      console.error('Zod validation error (Image):', error.errors);
      throw new Error(
        'Invalid response format from Gemini API for image analysis.',
      );
    }
    // Handle other potential errors (e.g., network errors from Gemini)
    else if (error instanceof Error) {
      console.error('Error generating content for image:', error.message);
    }
    // Handle unknown errors
    else {
      console.error(
        'An unexpected error occurred during image analysis:',
        error,
      );
    }
    // Re-throw a generic error
    throw new Error('Failed to analyze image.');
  }
}
