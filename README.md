# Gemini Multimodal Analysis with Deno

This project demonstrates how to use the Google Gemini API (specifically `gemini-1.5-pro`) with Deno to analyze different types of media files: images, videos, and audio.

## Features

- Analyzes images (`.png`, `.jpg`, `.jpeg`, `.webp`)
- Analyzes videos (`.mp4`, `.mov`, `.avi`, `.webm`)
- Analyzes audio (`.mp3`, `.wav`, `.ogg`, `.flac`, `.m4a`)
- Uses Deno for the runtime environment.
- Includes a `justfile` for easy command execution.
- Accepts a custom prompt via command-line argument.

## Prerequisites

- **Deno:** Install Deno from [https://deno.land/](https://deno.land/).
- **Google Gemini API Key:** Obtain an API key from [Google AI Studio](https://aistudio.google.com/app/apikey).
- **Just (Optional):** A command runner. Install from [https://github.com/casey/just](https://github.com/casey/just).

## Setup

1.  **Clone the repository (if applicable).**
2.  **Create an environment file:**
    Copy the example environment file:
    ```bash
    cp .env.example .env
    ```
    Edit the `.env` file and add your Google Gemini API key:
    ```dotenv
    GEMINI_API_KEY=YOUR_API_KEY_HERE
    ```
3.  **Place media files:**
    Ensure you have the following files in the project's root directory:
    - `image.png`
    - `video.mp4`
    - `audio.mp3`
      (You can change the filenames referenced in `main.ts` if needed).

## Usage

The script `main.ts` performs analysis on all three media types.

**Using Just (Recommended):**

- **Run with `.env` file:** This is the easiest way.
  ```bash
  just run-with-env
  ```
- **Run with custom prompt:**
  ```bash
  # Make sure to quote the prompt if it contains spaces
  just run-with-env "What animal is shown in the image?"
  ```
- **Run with watch mode (for development):** Automatically restarts the script on file changes.
  ```bash
  just watch
  ```

**Using Deno Directly:**

- **Run with required permissions and `.env` file:**
  ```bash
  deno run --allow-env --allow-read --allow-net --env-file=.env main.ts
  ```
- **Run with custom prompt:**
  ```bash
  deno run --allow-env --allow-read --allow-net --env-file=.env main.ts "Summarize the audio clip."
  ```

## Code Structure

- `main.ts`: Entry point, orchestrates the analysis calls.
- `imageAnalysis.ts`: Contains the `analyzeImage` function.
- `videoAnalysis.ts`: Contains the `analyzeVideo` function.
- `audioAnalysis.ts`: Contains the `analyzeAudio` function.
- `justfile`: Defines convenient command aliases using `just`.
- `deno.json`: Deno configuration file.
- `.env`: Stores the API key (gitignored).
- `.env.example`: Example environment file.
