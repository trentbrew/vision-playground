import { GoogleGenerativeAI, Part } from '@google/generative-ai';
import { extname } from 'https://deno.land/std@0.224.0/path/mod.ts';
import { encodeBase64 } from 'https://deno.land/std@0.224.0/encoding/base64.ts';
import { z } from 'https://deno.land/x/zod@v3.23.8/mod.ts';

// Schema for the basic validated analysis response
const videoAnalysisSchema = z.object({
  analysis: z
    .string()
    .min(1, { message: 'Video analysis text cannot be empty.' }),
});

// Type alias for the schema
type VideoAnalysisResponse = z.infer<typeof videoAnalysisSchema>;

// Basic function to determine mime type from file extension
function getMimeType(filePath: string): string | undefined {
  const ext = extname(filePath).toLowerCase();
  switch (ext) {
    case '.mp4':
      return 'video/mp4';
    case '.mov':
      return 'video/quicktime';
    case '.avi':
      return 'video/x-msvideo';
    case '.webm':
      return 'video/webm';
    // Add more mime types as needed
    default:
      return undefined;
  }
}

/**
 * Analyzes a video using the Gemini API.
 * @param apiKey The Google Generative AI API key.
 * @param videoPath The path to the video file.
 * @param prompt The prompt to use for analysis.
 * @returns A validated analysis object.
 */
export async function analyzeVideo(
  apiKey: string,
  videoPath: string,
  prompt: string,
): Promise<VideoAnalysisResponse> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

  const mimeType = getMimeType(videoPath);
  if (!mimeType) {
    throw new Error(`Could not determine mime type for file: ${videoPath}`);
  }

  // Read the video file and encode it to Base64
  const videoData = Deno.readFileSync(videoPath);
  const base64EncodedVideo = encodeBase64(videoData);

  const videoPart: Part = {
    inlineData: {
      mimeType: mimeType,
      data: base64EncodedVideo,
    },
  };

  try {
    // Send inlineData instead of fileUri
    const result = await model.generateContent([
      videoPart,
      { text: prompt || 'Describe the video in detail.' },
    ]);
    const response = result.response;
    const responseText = response.text();

    // Validate and return the structured response
    return videoAnalysisSchema.parse({ analysis: responseText });
  } catch (error) {
    // Check for ZodError first
    if (error instanceof z.ZodError) {
      console.error('Zod validation error (Video):', error.errors);
      throw new Error(
        'Invalid response format from Gemini API for video analysis.',
      );
    }
    // Handle other potential errors
    else if (error instanceof Error) {
      console.error('Error generating content for video:', error.message);
    }
    // Handle unknown errors
    else {
      console.error(
        'An unexpected error occurred during video analysis:',
        error,
      );
    }
    // Re-throw a generic error
    throw new Error('Failed to analyze video.');
  }
}
