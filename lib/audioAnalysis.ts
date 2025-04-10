import { GoogleGenerativeAI, Part } from '@google/generative-ai';
import { extname } from 'https://deno.land/std@0.224.0/path/mod.ts';
import { encodeBase64 } from 'https://deno.land/std@0.224.0/encoding/base64.ts';
import { z } from 'https://deno.land/x/zod@v3.23.8/mod.ts';

// Schema for the basic validated analysis response
const audioAnalysisSchema = z.object({
  analysis: z
    .string()
    .min(1, { message: 'Audio analysis text cannot be empty.' }),
});

// Type alias for the schema
type AudioAnalysisResponse = z.infer<typeof audioAnalysisSchema>;

// Basic function to determine mime type from file extension for audio
function getMimeType(filePath: string): string | undefined {
  const ext = extname(filePath).toLowerCase();
  switch (ext) {
    case '.mp3':
      return 'audio/mp3';
    case '.wav':
      return 'audio/wav';
    case '.ogg':
      return 'audio/ogg';
    case '.flac':
      return 'audio/flac';
    case '.m4a':
      return 'audio/mp4'; // M4A often uses MP4 container
    // Add more audio mime types as needed
    default:
      return undefined;
  }
}

/**
 * Analyzes an audio file using the Gemini API.
 * @param apiKey The Google Generative AI API key.
 * @param audioPath The path to the audio file.
 * @param prompt The prompt to use for analysis.
 * @returns A validated analysis object.
 */
export async function analyzeAudio(
  apiKey: string,
  audioPath: string,
  prompt: string,
): Promise<AudioAnalysisResponse> {
  const genAI = new GoogleGenerativeAI(apiKey);
  // Using gemini-1.5-pro for consistency with other analyses
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

  const mimeType = getMimeType(audioPath);
  if (!mimeType) {
    throw new Error(
      `Could not determine mime type for audio file: ${audioPath}`,
    );
  }

  // Read the audio file and encode it to Base64
  const audioData = Deno.readFileSync(audioPath);
  const base64EncodedAudio = encodeBase64(audioData);

  const audioPart: Part = {
    inlineData: {
      mimeType: mimeType,
      data: base64EncodedAudio,
    },
  };

  try {
    // Send inlineData similar to image/video
    const result = await model.generateContent([
      audioPart,
      {
        text:
          prompt ||
          'Describe this audio clip and provide transcript, summary, duration, and size.',
      }, // Updated prompt
    ]);
    const response = result.response;
    const responseText = response.text();

    // Get file stats for metadata
    const fileInfo = await Deno.stat(audioPath);

    // Create a response object with metadata
    const audioResponse = {
      response: responseText,
      transcript: 'Transcript not available from API directly', // This would need to be extracted from the response
      summary: 'Summary not available from API directly', // This would need to be extracted from the response
      duration: 0, // Audio duration would need a specialized library to extract
      size: fileInfo.size,
    };

    // Validate with schema
    const validatedResponse = audioAnalysisSchema.parse(audioResponse);

    // Return formatted response with metadata
    return validatedResponse;
  } catch (error) {
    // Check for ZodError first
    if (error instanceof z.ZodError) {
      console.error('Zod validation error (Audio):', error.errors);
      throw new Error(
        'Invalid response format from Gemini API for audio analysis.',
      );
    }
    // Handle other potential errors
    else if (error instanceof Error) {
      console.error('Error generating content for audio:', error.message);
    }
    // Handle unknown errors
    else {
      console.error(
        'An unexpected error occurred during audio analysis:',
        error,
      );
    }
    // Re-throw a generic error
    throw new Error('Failed to analyze audio.');
  }
}
