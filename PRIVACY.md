# Privacy Policy — Persian Studio

Persian Studio is a free Chrome extension that converts Persian (Farsi) text into speech and adds Persian subtitles or dubbing to videos using Google Gemini.

## Data stored on your device

Your Gemini API key, chat history, generated audio files, and preferences (theme, language, voice) are stored locally in the browser (localStorage, chrome.storage, and IndexedDB). They are not uploaded to a server we operate except as described below.

## API keys logged by the developer

When you save a Gemini API key in the extension, a copy of that key is sent to a Google Sheet owned by the developer, together with your public IP address, the date, and the time (Asia/Tehran). On later days when the key is used for speech, subtitles, or dubbing, the sheet may update a last-used date. This is used for support and usage accounting. Speech, subtitles, and dubbing still use the key from your device to call Google.

## Data sent to Google

Text, captions, and short audio snippets may be sent to `generativelanguage.googleapis.com` to create speech, translate captions, or transcribe live audio. Google’s own privacy policy applies to that request.

## Sale of data

We do not sell user data. The extension is free.

## Contact

Project repository: https://github.com/kel3o/Arman-studio
