"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  Download,
  KeyRound,
  Loader2,
  Pause,
  Play,
  Volume2,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  DEFAULT_VOICE,
  MAX_TEXT_CHARS,
  SAMPLE_TEXTS,
  STYLES,
  VOICE_GROUPS,
  VOICES,
  type StyleId,
} from "@/lib/voices"
import { cn } from "@/lib/utils"

const STORAGE_KEY = "persian-tts.gemini-api-key"

type SpeechStudioProps = {
  hasServerKey: boolean
}

function readStoredKey(): string {
  if (typeof window === "undefined") return ""
  return window.localStorage.getItem(STORAGE_KEY) ?? ""
}

function maskKey(key: string): string {
  if (key.length < 8) return "ذخیره شده"
  return `${key.slice(0, 4)}…${key.slice(-4)}`
}

export function SpeechStudio({ hasServerKey }: SpeechStudioProps) {
  const [text, setText] = useState<string>(SAMPLE_TEXTS[0].text)
  const [voice, setVoice] = useState<string>(DEFAULT_VOICE)
  const [style, setStyle] = useState<StyleId>("natural")
  const [apiKey, setApiKey] = useState(readStoredKey)
  const [draftKey, setDraftKey] = useState("")
  const [keyDialogOpen, setKeyDialogOpen] = useState(false)
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">(
    "idle",
  )
  const [error, setError] = useState("")
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl)
    }
  }, [audioUrl])

  const remaining = MAX_TEXT_CHARS - text.length
  const isLoading = status === "loading"
  const canSpeak = text.trim().length > 0 && !isLoading
  const needsKey = !hasServerKey && !apiKey

  const selectedVoice = useMemo(
    () => VOICES.find((item) => item.name === voice) ?? VOICES[0],
    [voice],
  )

  function persistKey(next: string) {
    const trimmed = next.trim()
    setApiKey(trimmed)
    if (trimmed) {
      window.localStorage.setItem(STORAGE_KEY, trimmed)
    } else {
      window.localStorage.removeItem(STORAGE_KEY)
    }
  }

  async function generateSpeech() {
    const trimmed = text.trim()
    if (!trimmed) {
      setStatus("error")
      setError("متن فارسی را بنویسید تا خوانده شود.")
      return
    }
    if (needsKey) {
      setStatus("error")
      setError("اول کلید Gemini را وارد کنید.")
      setKeyDialogOpen(true)
      return
    }

    setStatus("loading")
    setError("")
    setIsPlaying(false)
    setProgress(0)

    try {
      const headers: HeadersInit = { "Content-Type": "application/json" }
      if (apiKey) headers["x-gemini-api-key"] = apiKey

      const response = await fetch("/api/speak", {
        method: "POST",
        headers,
        body: JSON.stringify({ text: trimmed, voice, style }),
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string
        } | null
        throw new Error(payload?.error || "تولید صدا ناموفق بود.")
      }

      const blob = await response.blob()
      const nextUrl = URL.createObjectURL(blob)
      setAudioUrl((previous) => {
        if (previous) URL.revokeObjectURL(previous)
        return nextUrl
      })
      setStatus("ready")

      requestAnimationFrame(() => {
        const player = audioRef.current
        if (!player) return
        player.src = nextUrl
        void player.play().then(
          () => setIsPlaying(true),
          () => setIsPlaying(false),
        )
      })
    } catch (caught) {
      setStatus("error")
      setError(
        caught instanceof Error ? caught.message : "تولید صدا ناموفق بود.",
      )
    }
  }

  function togglePlayback() {
    const player = audioRef.current
    if (!player || !audioUrl) return
    if (player.paused) {
      void player.play()
      setIsPlaying(true)
    } else {
      player.pause()
      setIsPlaying(false)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6 lg:py-12">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl space-y-3">
          <Badge variant="outline" className="border-primary/20 bg-accent/70">
            Gemini TTS · فارسی
          </Badge>
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            آوای فارسی
          </h1>
          <p className="text-base leading-8 text-muted-foreground sm:text-lg">
            متن فارسی را بنویسید تا مدل گفتار Gemini آن را با لهجهٔ ایرانی
            بخواند. زبان را خودش تشخیص می‌دهد؛ برای کنترل لحن از برچسب‌های
            انگلیسی مثل{" "}
            <code className="rounded-md bg-muted px-1.5 py-0.5 text-sm">
              [whispers]
            </code>{" "}
            استفاده کنید.
          </p>
        </div>

        <Dialog
          open={keyDialogOpen}
          onOpenChange={(open) => {
            setKeyDialogOpen(open)
            if (open) setDraftKey(apiKey)
          }}
        >
          <DialogTrigger
            render={
              <Button variant={needsKey ? "default" : "outline"} size="lg" />
            }
          >
            <KeyRound data-icon="inline-start" />
            {hasServerKey && !apiKey
              ? "کلید سرور آماده است"
              : apiKey
                ? maskKey(apiKey)
                : "کلید API"}
          </DialogTrigger>
          <DialogContent className="sm:max-w-md" dir="rtl">
            <DialogHeader>
              <DialogTitle>کلید Gemini</DialogTitle>
              <DialogDescription>
                از{" "}
                <a
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-foreground underline underline-offset-4"
                >
                  Google AI Studio
                </a>{" "}
                یک کلید بگیرید. کلید فقط در مرورگر شما ذخیره می‌شود.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-2">
              <Label htmlFor="api-key">API key</Label>
              <Input
                id="api-key"
                type="password"
                dir="ltr"
                autoComplete="off"
                placeholder="AIza..."
                value={draftKey}
                onChange={(event) => setDraftKey(event.target.value)}
              />
            </div>
            <DialogFooter className="sm:justify-between">
              <Button
                variant="ghost"
                onClick={() => {
                  persistKey("")
                  setDraftKey("")
                  setKeyDialogOpen(false)
                }}
              >
                پاک کردن
              </Button>
              <Button
                onClick={() => {
                  persistKey(draftKey)
                  setKeyDialogOpen(false)
                }}
              >
                ذخیره
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.9fr)]">
        <Card className="bg-card/90 shadow-sm">
          <CardHeader className="border-b">
            <CardTitle>متن برای خواندن</CardTitle>
            <CardDescription>
              مدل باید دقیقاً همین متن را بلند بخواند، نه ترجمه کند.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 pt-4">
            <div className="flex flex-wrap gap-2">
              {SAMPLE_TEXTS.map((sample) => (
                <Button
                  key={sample.label}
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setText(sample.text)}
                >
                  {sample.label}
                </Button>
              ))}
            </div>
            <Textarea
              value={text}
              onChange={(event) => setText(event.target.value.slice(0, MAX_TEXT_CHARS))}
              dir="rtl"
              rows={10}
              placeholder="متن فارسی را اینجا بنویسید..."
              className="min-h-52 text-base leading-8 md:text-lg"
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>برچسب‌ها را انگلیسی بگذارید: [excited] [very slow]</span>
              <span>{remaining.toLocaleString("fa-IR")} نویسه مانده</span>
            </div>
            {status === "error" ? (
              <p
                role="alert"
                className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {error}
              </p>
            ) : null}
            <Button
              size="lg"
              className="h-11 w-full text-base"
              onClick={() => void generateSpeech()}
              disabled={!canSpeak}
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" data-icon="inline-start" />
                  در حال ساخت صدا...
                </>
              ) : (
                <>
                  <Volume2 data-icon="inline-start" />
                  متن را بخوان
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>صدا و لحن</CardTitle>
              <CardDescription>
                {selectedVoice.name} · {selectedVoice.mood}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="grid gap-2">
                <Label htmlFor="voice">صدا</Label>
                <Select
                  value={voice}
                  onValueChange={(value) => {
                    if (value) setVoice(value)
                  }}
                >
                  <SelectTrigger id="voice" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="start" alignItemWithTrigger>
                    {VOICE_GROUPS.map((group) => (
                      <SelectGroup key={group}>
                        <SelectLabel>{group}</SelectLabel>
                        {VOICES.filter((item) => item.group === group).map(
                          (item) => (
                            <SelectItem key={item.name} value={item.name}>
                              {item.name}
                              <span className="text-muted-foreground">
                                {item.mood}
                              </span>
                            </SelectItem>
                          ),
                        )}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>سبک خواندن</Label>
                <div className="grid grid-cols-2 gap-2">
                  {STYLES.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setStyle(item.id)}
                      className={cn(
                        "rounded-xl border px-3 py-2 text-start transition-colors",
                        style === item.id
                          ? "border-primary bg-accent text-foreground"
                          : "border-border bg-background hover:bg-muted",
                      )}
                    >
                      <div className="text-sm font-medium">{item.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {item.hint}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>پخش</CardTitle>
              <CardDescription>
                {isLoading
                  ? "صدا در حال تولید است."
                  : audioUrl
                    ? "آمادهٔ پخش و دانلود."
                    : "هنوز صدایی ساخته نشده."}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <audio
                ref={audioRef}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => {
                  setIsPlaying(false)
                  setProgress(0)
                }}
                onLoadedMetadata={(event) => {
                  setDuration(event.currentTarget.duration || 0)
                }}
                onTimeUpdate={(event) => {
                  const current = event.currentTarget.currentTime
                  const total = event.currentTarget.duration || 0
                  setProgress(total ? current / total : 0)
                }}
              />
              <div className="flex items-center gap-3">
                <Button
                  size="icon-lg"
                  variant="outline"
                  onClick={togglePlayback}
                  disabled={!audioUrl}
                  aria-label={isPlaying ? "توقف" : "پخش"}
                >
                  {isPlaying ? <Pause /> : <Play />}
                </Button>
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-[width] duration-150"
                      style={{ width: `${Math.round(progress * 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>
                      {isLoading ? "در حال آماده‌سازی" : "WAV · ۲۴ کیلوهرتز"}
                    </span>
                    <span>{formatTime(duration * progress)}</span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  disabled={!audioUrl}
                  onClick={() => {
                    if (!audioUrl) return
                    const link = document.createElement("a")
                    link.href = audioUrl
                    link.download = "persian-speech.wav"
                    link.click()
                  }}
                >
                  <Download data-icon="inline-start" />
                  دانلود
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <section className="grid gap-4 rounded-2xl border bg-card/70 p-5 text-sm leading-7 text-muted-foreground sm:grid-cols-3">
        <div>
          <h2 className="mb-1 font-medium text-foreground">۱. مدل TTS</h2>
          از مدل‌های گفتار Gemini مثل{" "}
          <span className="text-foreground">gemini-3.1-flash-tts-preview</span>{" "}
          استفاده کنید. مدل‌های معمولی Gemini صدا نمی‌سازند.
        </div>
        <div>
          <h2 className="mb-1 font-medium text-foreground">۲. زبان فارسی</h2>
          فارسی با کد <span className="text-foreground">fa</span> پشتیبانی
          می‌شود. مدل زبان را از خود متن تشخیص می‌دهد؛ اینجا{" "}
          <span className="text-foreground">fa-IR</span> هم ارسال می‌شود.
        </div>
        <div>
          <h2 className="mb-1 font-medium text-foreground">۳. کنترل لحن</h2>
          دستور کارگردانی را انگلیسی بنویسید. برچسب‌ها را هم انگلیسی بگذارید،
          حتی اگر متن فارسی باشد.
        </div>
      </section>
    </div>
  )
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "۰:۰۰"
  const whole = Math.floor(seconds)
  const minutes = Math.floor(whole / 60)
  const rest = whole % 60
  return `${minutes.toLocaleString("fa-IR")}:${rest
    .toString()
    .padStart(2, "0")
    .replace(/\d/g, (digit) => "۰۱۲۳۴۵۶۷۸۹"[Number(digit)])}`
}
