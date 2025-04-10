import { GoogleGenerativeAI, Part } from '@google/generative-ai';
import { extname } from 'https://deno.land/std@0.224.0/path/mod.ts';
import { encodeBase64 } from 'https://deno.land/std@0.224.0/encoding/base64.ts';
import { z } from 'https://deno.land/x/zod@v3.23.8/mod.ts';

// Schema for the basic validated analysis response
const documentAnalysisSchema = z.object({
  analysis: z
    .string()
    .min(1, { message: 'Document analysis text cannot be empty.' }),
});

// Type alias for the schema
type DocumentAnalysisResponse = z.infer<typeof documentAnalysisSchema>;

// Basic function to determine mime type from file extension for documents
function getMimeType(filePath: string): string | undefined {
  const ext = extname(filePath).toLowerCase();
  switch (ext) {
    // Text-based formats (work well with inlineData)
    case '.txt':
      return 'text/plain';
    case '.md':
      return 'text/markdown';
    case '.html':
      return 'text/html';
    case '.css':
      return 'text/css';
    case '.js':
      return 'text/javascript';
    case '.json':
      return 'application/json';
    case '.csv':
      return 'text/csv';
    case '.xml':
      return 'application/xml'; // More specific than text/plain
    case '.yaml':
    case '.yml':
      return 'application/x-yaml'; // Common MIME type
    case '.log':
      return 'text/plain';

    // Complex/Binary formats (results may vary with inlineData)
    case '.pdf':
      return 'application/pdf';
    // case '.docx': // Microsoft Word (OpenXML)
    //   return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    // case '.doc': // Older Microsoft Word
    //   return 'application/msword';

    default:
      return undefined;
  }
}

/**
 * Analyzes a document file using the Gemini API (via inlineData).
 * Works best for text-based formats (TXT, MD, HTML, CSV, JSON, code).
 * Support for complex formats like PDF via inlineData is experimental and may yield limited results.
 * @param apiKey The Google Generative AI API key.
 * @param documentPath The path to the document file.
 * @param prompt The prompt to use for analysis.
 * @returns A validated analysis object.
 */
export async function analyzeDocument(
  apiKey: string,
  documentPath: string,
  prompt: string,
): Promise<DocumentAnalysisResponse> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

  const mimeType = getMimeType(documentPath);
  if (!mimeType) {
    throw new Error(
      `Could not determine or unsupported mime type for document file: ${documentPath}`,
    );
  }

  console.log(
    `Attempting to analyze document: ${documentPath} with MIME type: ${mimeType}`,
  );

  const documentData = Deno.readFileSync(documentPath);
  const base64EncodedDocument = encodeBase64(documentData);

  const documentPart: Part = {
    inlineData: {
      mimeType: mimeType,
      data: base64EncodedDocument,
    },
  };

  try {
    const result = await model.generateContent([
      documentPart,
      { text: prompt || 'Summarize this document.' }, // Default prompt
    ]);
    const response = result.response;
    const responseText = response.text();

    // Validate and return the structured response
    return documentAnalysisSchema.parse({ analysis: responseText });
  } catch (error) {
    // Check for ZodError first
    if (error instanceof z.ZodError) {
      console.error('Zod validation error (Document):', error.errors);
      throw new Error(
        'Invalid response format from Gemini API for document analysis.',
      );
    }
    // Handle other potential errors
    else if (error instanceof Error) {
      console.error(
        `Error generating content for document (${mimeType}):`,
        error.message,
      );
    }
    // Handle unknown errors
    else {
      console.error(
        'An unexpected error occurred during document analysis:',
        error,
      );
    }
    // Re-throw a generic error
    throw new Error(`Failed to analyze document (${documentPath}).`);
  }
}
