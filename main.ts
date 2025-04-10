import process from 'node:process';
import { analyzeImage } from './lib/imageAnalysis.ts';
import { analyzeVideo } from './lib/videoAnalysis.ts';
import { analyzeAudio } from './lib/audioAnalysis.ts';
import { analyzeDocument } from './lib/documentAnalysis.ts';

async function run() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('Error: GEMINI_API_KEY environment variable not set.');
    process.exit(1);
  }

  const imagePath = 'trica.png';
  const videoPath = 'video.mp4';
  const audioPath = 'audio.wav';
  const documentPath = 'document.txt';

  const prompt =
    Deno.args.length > 0 ? Deno.args[0] : 'Describe this content in detail.';

  try {
    // Image analysis
    console.log('--- Analyzing Image ---');
    const imageResult = await analyzeImage(apiKey, imagePath, prompt);
    console.log('Image Analysis:', imageResult.analysis);

    // Video analysis
    console.log('\n--- Analyzing Video ---');
    const videoResult = await analyzeVideo(apiKey, videoPath, prompt);
    console.log('Video Analysis:', videoResult.analysis);

    // Audio analysis
    console.log('\n--- Analyzing Audio ---');
    const audioResult = await analyzeAudio(apiKey, audioPath, prompt);
    console.log('Audio Analysis:', audioResult.analysis);

    // Document analysis
    console.log('\n--- Analyzing Document ---');
    const documentResult = await analyzeDocument(apiKey, documentPath, prompt);
    console.log('Document Analysis:', documentResult.analysis);
  } catch (error) {
    if (error instanceof Error) {
      console.error('\n--- Error in main execution ---');
      console.error(error.message);
    } else {
      console.error('\n--- An unexpected error occurred in main ---', error);
    }
    process.exit(1);
  }
}

run();
