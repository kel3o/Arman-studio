# استدیو آرمان

متن فارسی را با [Gemini text-to-speech](https://ai.google.dev/gemini-api/docs/generate-content/speech-generation) به صدای طبیعی تبدیل می‌کند. فارسی (`fa`) در فهرست زبان‌های رسمی Gemini TTS هست؛ مدل زبان را از خود متن تشخیص می‌دهد.

## کارهایی که باید انجام بدهید

1. از [Google AI Studio](https://aistudio.google.com/apikey) یک کلید Gemini بگیرید.
2. کلید را در صفحه وارد کنید، یا در `.env.local` بگذارید:

```bash
GEMINI_API_KEY=your_key_here
```

3. متن فارسی را بنویسید و «تولید فایل صوتی» را بزنید. سقف متن ۱۰٬۰۰۰ نویسه است.

## اجرای محلی

```bash
npm install
npm run dev
```

اپ روی [http://127.0.0.1:43147](http://127.0.0.1:43147) بالا می‌آید.

## نکات مهم از مستندات Gemini

- فقط مدل‌های TTS صدا می‌سازند؛ مثلاً `gemini-3.1-flash-tts-preview` یا `gemini-2.5-flash-preview-tts`.
- خروجی صداست، نه متن. ورودی هم باید متن باشد.
- برای لهجهٔ ایرانی، در پرامپت بگویید متن را با لهجهٔ فارسی تهرانی بخواند و `languageCode` را `fa-IR` بگذارید.
- اگر متن فارسی است، برچسب‌های لحن را همچنان انگلیسی بنویسید: `[whispers]`، `[excited]`، `[very slow]`.
- دستور کارگردانی را جدا از متنِ قابل‌خواندن برچسب بزنید تا مدل توضیحات را بلند نخواند.

نمونهٔ درخواست خام:

```bash
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-tts-preview:generateContent" \
  -H "x-goog-api-key: $GEMINI_API_KEY" \
  -H "Content-Type: application/json" \
  -X POST \
  -d '{
    "contents": [{
      "parts": [{
        "text": "Synthesize speech for this Persian transcript. Use a native Tehran accent.\n\n#### TRANSCRIPT\nسلام، امروز هوا خیلی خوب است."
      }]
    }],
    "generationConfig": {
      "responseModalities": ["AUDIO"],
      "speechConfig": {
        "languageCode": "fa-IR",
        "voiceConfig": {
          "prebuiltVoiceConfig": { "voiceName": "Kore" }
        }
      }
    }
  }'
```

خروجی PCM خام ۲۴ کیلوهرتز، مونو، ۱۶ بیت است و این پروژه آن را به WAV تبدیل می‌کند.
