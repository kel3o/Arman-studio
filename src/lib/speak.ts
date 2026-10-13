import { logApiUsage } from "@/lib/api-log"
import { audioBytesToWav, wavToBlob } from "@/lib/pcm-to-wav"
import { buildSpeechPrompt } from "@/lib/tts"
import {
  DEFAULT_VOICE,
  MAX_CUSTOM_STYLE_CHARS,
  MAX_TEXT_CHARS,
  STYLES,
  TTS_MODELS,
  VOICES,
  type StyleId,
} from "@/lib/voices"

const VOICE_NAMES = new Set<string>(VOICES.map((voice) => voice.name))
const STYLE_IDS = new Set<string>(STYLES.map((style) => style.id))

const GEMINI_ORIGIN =
  process.env.NODE_ENV === "development"
    ? "/gemini"
    : "https://generativelanguage.googleapis.com"

export type SpeakRequest = {
  text: string
  voice?: string
  style?: string
  customStyle?: string
  apiKey: string
  signal?: AbortSignal
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

function errorMessage(error: unknown): string {
  if (error && typeof error === "object") {
    const record = error as {
      message?: string
      error?: { message?: string }
    }
    if (record.error?.message) return record.error.message
    if (record.message) return record.message
  }
  if (error instanceof Error) return error.message
  return "تولید صدا ناموفق بود."
}

function isRetryable(error: unknown): boolean {
  const message = errorMessage(error).toLowerCase()
  return (
    message.includes("500") ||
    message.includes("internal") ||
    message.includes("unavailable") ||
    message.includes("try again")
  )
}

function isNotFound(error: unknown): boolean {
  const message = errorMessage(error).toLowerCase()
  return message.includes("404") || message.includes("not found")
}

function userFacingError(message: string): string {
  if (/403|permission|api key|invalid/i.test(message)) {
    return "کلید API نامعتبر است. از Google AI Studio یک کلید Gemini بگیرید."
  }
  if (/429|quota|rate/i.test(message)) {
    return "سهمیهٔ API پر شده. کمی بعد دوباره امتحان کنید."
  }
  return message
}

async function generateSpeech(options: {
  apiKey: string
  prompt: string
  voice: string
  signal?: AbortSignal
}): Promise<Uint8Array> {
  let lastError: unknown
  const languageCodes = ["fa-IR", "fa", undefined] as const

  for (const model of TTS_MODELS) {
    for (const languageCode of languageCodes) {
      for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
          const response = await fetch(
            `${GEMINI_ORIGIN}/v1beta/models/${model}:generateContent`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-goog-api-key": options.apiKey,
              },
              body: JSON.stringify({
                contents: [{ parts: [{ text: options.prompt }] }],
                generationConfig: {
                  responseModalities: ["AUDIO"],
                  speechConfig: {
                    ...(languageCode ? { languageCode } : {}),
                    voiceConfig: {
                      prebuiltVoiceConfig: {
                        voiceName: options.voice,
                      },
                    },
                  },
                },
              }),
              signal: options.signal,
            },
          )

          const payload = (await response.json().catch(() => null)) as {
            error?: { message?: string }
            candidates?: Array<{
              content?: {
                parts?: Array<{
                  inlineData?: { data?: string; mimeType?: string }
                }>
              }
            }>
          } | null

          if (!response.ok) {
            throw new Error(
              payload?.error?.message || `Gemini HTTP ${response.status}`,
            )
          }

          const part = payload?.candidates?.[0]?.content?.parts?.[0]
          const pcm = part?.inlineData?.data
            ? base64ToBytes(part.inlineData.data)
            : null
          if (!pcm?.length) {
            throw new Error(
              "مدل به‌جای صدا، پاسخ خالی برگرداند. دوباره امتحان کنید.",
            )
          }

          return audioBytesToWav(pcm, part?.inlineData?.mimeType)
        } catch (error) {
          lastError = error
          if (options.signal?.aborted) throw error
          if (isNotFound(error)) break
          if (isRetryable(error) && attempt < 2) continue
          break
        }
      }
    }
  }

  throw lastError ?? new Error("تولید صدا ناموفق بود.")
}

export async function requestSpeech(options: SpeakRequest): Promise<Blob> {
  const apiKey = options.apiKey.trim()
  if (!apiKey) {
    throw new Error("اول کلید Gemini را وارد کنید.")
  }

  const text = options.text.trim()
  if (!text) {
    throw new Error("متن فارسی را وارد کنید.")
  }
  if (text.length > MAX_TEXT_CHARS) {
    throw new Error(`متن نباید بیشتر از ${MAX_TEXT_CHARS} نویسه باشد.`)
  }

  const voice =
    typeof options.voice === "string" && VOICE_NAMES.has(options.voice)
      ? options.voice
      : DEFAULT_VOICE
  const style =
    typeof options.style === "string" && STYLE_IDS.has(options.style)
      ? (options.style as StyleId)
      : "natural"
  const customStyle = (options.customStyle ?? "")
    .trim()
    .slice(0, MAX_CUSTOM_STYLE_CHARS)

  if (style === "custom" && !customStyle) {
    throw new Error("برای سبک سفارشی، توضیح کوتاهی بنویسید.")
  }

  try {
    const wav = await generateSpeech({
      apiKey,
      prompt: buildSpeechPrompt(text, style, customStyle),
      voice,
      signal: options.signal,
    })
    void logApiUsage(apiKey)
    return wavToBlob(wav)
  } catch (error) {
    if (options.signal?.aborted) throw error
    throw new Error(userFacingError(errorMessage(error)))
  }
}
