import { audioBytesToWav, pcmToWav, floatTo16BitPcm } from "./pcm-to-wav.js"

const GEMINI_ORIGIN = "https://generativelanguage.googleapis.com"
const TTS_MODELS = [
  "gemini-3.1-flash-tts-preview",
  "gemini-2.5-flash-preview-tts",
]
const TEXT_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-flash-latest"]

function base64ToBytes(value) {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

function bytesToBase64(bytes) {
  let binary = ""
  const chunk = 0x2000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

function errorMessage(error) {
  if (error && typeof error === "object") {
    if (error.error?.message) return error.error.message
    if (error.message) return error.message
  }
  if (error instanceof Error) return error.message
  return "Gemini request failed."
}

function userFacingError(message, locale) {
  const fa = locale !== "en"
  if (/403|permission|api key|invalid/i.test(message)) {
    return fa
      ? "کلید API نامعتبر است. از Google AI Studio یک کلید Gemini بگیرید."
      : "The API key is invalid. Get a Gemini key from Google AI Studio."
  }
  if (/429|quota|rate/i.test(message)) {
    return fa
      ? "سهمیهٔ API پر شده. کمی بعد دوباره امتحان کنید."
      : "API quota is exhausted. Try again in a moment."
  }
  return message
}

async function generateJson(apiKey, path, body, signal) {
  const response = await fetch(`${GEMINI_ORIGIN}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify(body),
    signal,
  })
  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(payload?.error?.message || `Gemini HTTP ${response.status}`)
  }
  return payload
}

function extractText(payload) {
  const parts = payload?.candidates?.[0]?.content?.parts || []
  return parts.map((part) => part.text || "").join("\n").trim()
}

function parseJsonArray(text) {
  const trimmed = String(text || "").trim()
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const raw = (fenced ? fenced[1] : trimmed).trim()
  const start = raw.indexOf("[")
  const end = raw.lastIndexOf("]")
  if (start === -1 || end === -1) throw new Error("Model did not return JSON.")
  return JSON.parse(raw.slice(start, end + 1))
}

export async function translateCues({ apiKey, cues, locale = "fa", signal }) {
  const items = (cues || [])
    .map((cue, index) => ({
      i: Number.isFinite(cue.i) ? cue.i : index,
      text: String(cue.text || "").trim(),
    }))
    .filter((cue) => cue.text)
  if (!items.length) return []

  const out = new Map()
  const batchSize = 32
  let lastError = null

  for (let offset = 0; offset < items.length; offset += batchSize) {
    const batch = items.slice(offset, offset + batchSize)
    const prompt = [
      "You are a professional audiovisual translator.",
      "Translate each caption into natural Iranian Persian (Farsi).",
      "Keep names, numbers, and on-screen terms.",
      "Do not add extra lines. Do not transliterate the whole sentence into Latin.",
      'Return ONLY a JSON array: [{"i":0,"t":"..."}].',
      "",
      batch.map((cue) => `${cue.i}: ${cue.text}`).join("\n"),
    ].join("\n")

    let translated = false
    for (const model of TEXT_MODELS) {
      try {
        const payload = await generateJson(
          apiKey,
          `/v1beta/models/${model}:generateContent`,
          { contents: [{ parts: [{ text: prompt }] }] },
          signal,
        )
        const parsed = parseJsonArray(extractText(payload))
        for (const row of parsed) {
          const i = Number(row.i)
          const t = String(row.t || "").trim()
          if (Number.isFinite(i) && t) out.set(i, t)
        }
        translated = true
        break
      } catch (error) {
        lastError = error
        if (signal?.aborted) throw error
      }
    }
    if (!translated) {
      throw new Error(userFacingError(errorMessage(lastError), locale))
    }
  }

  return items.map((cue) => ({
    i: cue.i,
    text: out.get(cue.i) || cue.text,
  }))
}

export async function synthesizeSpeechWav({
  apiKey,
  text,
  voice = "Kore",
  locale = "fa",
  signal,
}) {
  const prompt = [
    "Synthesize speech for the Persian (Farsi) transcript below.",
    "Use a native Iranian Persian accent as spoken in Tehran.",
    "Read the transcript exactly as written. Do not translate it.",
    "Do not read these instructions aloud.",
    "",
    "### DIRECTOR'S NOTES",
    "Accent: Standard Iranian Persian (Farsi), Tehran",
    "Style: Natural conversational delivery.",
    "Pacing: Match a subtitle reading pace; keep it clear and not rushed.",
    "",
    "#### TRANSCRIPT",
    String(text || "").trim(),
  ].join("\n")

  let lastError = null
  const languageCodes = ["fa-IR", "fa", undefined]

  for (const model of TTS_MODELS) {
    for (const languageCode of languageCodes) {
      try {
        const payload = await generateJson(
          apiKey,
          `/v1beta/models/${model}:generateContent`,
          {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseModalities: ["AUDIO"],
              speechConfig: {
                ...(languageCode ? { languageCode } : {}),
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: voice },
                },
              },
            },
          },
          signal,
        )
        const part = payload?.candidates?.[0]?.content?.parts?.[0]
        const pcm = part?.inlineData?.data
          ? base64ToBytes(part.inlineData.data)
          : null
        if (!pcm?.length) throw new Error("Empty audio response.")
        const wav = audioBytesToWav(pcm, part?.inlineData?.mimeType)
        return {
          mimeType: "audio/wav",
          audioBase64: bytesToBase64(wav),
        }
      } catch (error) {
        lastError = error
        if (signal?.aborted) throw error
      }
    }
  }

  throw new Error(userFacingError(errorMessage(lastError), locale))
}

export async function transcribeTranslateAudio({
  apiKey,
  audioBase64,
  mimeType = "audio/wav",
  locale = "fa",
  signal,
}) {
  const prompt =
    "Transcribe the speech in this audio, then translate it into natural Iranian Persian (Farsi). Return only the Persian translation, no quotes or labels."
  let lastError = null
  for (const model of TEXT_MODELS) {
    try {
      const payload = await generateJson(
        apiKey,
        `/v1beta/models/${model}:generateContent`,
        {
          contents: [
            {
              parts: [
                {
                  inlineData: {
                    mimeType,
                    data: audioBase64,
                  },
                },
                { text: prompt },
              ],
            },
          ],
        },
        signal,
      )
      const text = extractText(payload)
      if (text) return text
    } catch (error) {
      lastError = error
      if (signal?.aborted) throw error
    }
  }
  throw new Error(userFacingError(errorMessage(lastError), locale))
}

export function pcmFloatToWavBase64(float32, sampleRate = 16000) {
  const pcm = floatTo16BitPcm(float32)
  const wav = pcmToWav(pcm, sampleRate, 1, 16)
  return bytesToBase64(wav)
}
