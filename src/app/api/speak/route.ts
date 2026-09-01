import { GoogleGenAI } from "@google/genai"

import { audioBytesToWav } from "@/lib/pcm-to-wav"
import { buildSpeechPrompt } from "@/lib/tts"
import {
  DEFAULT_VOICE,
  MAX_TEXT_CHARS,
  STYLES,
  TTS_MODELS,
  VOICES,
  type StyleId,
} from "@/lib/voices"

export const runtime = "nodejs"
export const maxDuration = 180

const VOICE_NAMES = new Set<string>(VOICES.map((voice) => voice.name))
const STYLE_IDS = new Set<string>(STYLES.map((style) => style.id))

type SpeakBody = {
  text?: unknown
  voice?: unknown
  style?: unknown
}

function resolveApiKey(request: Request): string | null {
  const headerKey = request.headers.get("x-gemini-api-key")?.trim()
  if (headerKey) return headerKey
  return process.env.GEMINI_API_KEY?.trim() || null
}

function asBuffer(data: unknown): Buffer | null {
  if (!data) return null
  if (Buffer.isBuffer(data)) return data
  if (data instanceof Uint8Array) return Buffer.from(data)
  if (typeof data === "string") return Buffer.from(data, "base64")
  return null
}

function errorMessage(error: unknown): string {
  if (error && typeof error === "object") {
    const record = error as {
      message?: string
      status?: number
      error?: { message?: string; status?: string }
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

async function generateSpeech(options: {
  apiKey: string
  prompt: string
  voice: string
}): Promise<{ wav: Buffer; model: string }> {
  const ai = new GoogleGenAI({ apiKey: options.apiKey })
  let lastError: unknown
  const languageCodes = ["fa-IR", "fa", undefined] as const

  for (const model of TTS_MODELS) {
    for (const languageCode of languageCodes) {
      for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
          const response = await ai.models.generateContent({
            model,
            contents: options.prompt,
            config: {
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
          })

          const part = response.candidates?.[0]?.content?.parts?.[0]
          const pcm = asBuffer(part?.inlineData?.data)
          if (!pcm?.length) {
            throw new Error(
              "مدل به‌جای صدا، پاسخ خالی برگرداند. دوباره امتحان کنید.",
            )
          }

          return {
            wav: audioBytesToWav(pcm, part?.inlineData?.mimeType),
            model,
          }
        } catch (error) {
          lastError = error
          if (isNotFound(error)) break
          if (isRetryable(error) && attempt < 2) continue
          break
        }
      }
    }
  }

  throw lastError ?? new Error("تولید صدا ناموفق بود.")
}

export async function POST(request: Request) {
  const apiKey = resolveApiKey(request)
  if (!apiKey) {
    return Response.json(
      {
        error:
          "کلید Gemini پیدا نشد. کلید را در صفحه وارد کنید یا GEMINI_API_KEY را در محیط تنظیم کنید.",
      },
      { status: 401 },
    )
  }

  let body: SpeakBody
  try {
    body = (await request.json()) as SpeakBody
  } catch {
    return Response.json({ error: "بدنهٔ درخواست نامعتبر است." }, { status: 400 })
  }

  const text = typeof body.text === "string" ? body.text.trim() : ""
  if (!text) {
    return Response.json({ error: "متن فارسی را وارد کنید." }, { status: 400 })
  }
  if (text.length > MAX_TEXT_CHARS) {
    return Response.json(
      { error: `متن نباید بیشتر از ${MAX_TEXT_CHARS} نویسه باشد.` },
      { status: 400 },
    )
  }

  const voice =
    typeof body.voice === "string" && VOICE_NAMES.has(body.voice)
      ? body.voice
      : DEFAULT_VOICE
  const style =
    typeof body.style === "string" && STYLE_IDS.has(body.style)
      ? (body.style as StyleId)
      : "natural"

  try {
    const { wav, model } = await generateSpeech({
      apiKey,
      prompt: buildSpeechPrompt(text, style),
      voice,
    })

    return new Response(new Uint8Array(wav), {
      headers: {
        "Content-Type": "audio/wav",
        "Content-Length": String(wav.length),
        "X-TTS-Model": model,
        "X-TTS-Voice": voice,
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    const message = errorMessage(error)
    const status = /403|permission|api key|invalid/i.test(message)
      ? 401
      : /429|quota|rate/i.test(message)
        ? 429
        : /prohibit|safety/i.test(message)
          ? 400
          : 502

    return Response.json(
      {
        error:
          status === 401
            ? "کلید API نامعتبر است. از Google AI Studio یک کلید Gemini بگیرید."
            : status === 429
              ? "سهمیهٔ API پر شده. کمی بعد دوباره امتحان کنید."
              : message,
      },
      { status },
    )
  }
}
