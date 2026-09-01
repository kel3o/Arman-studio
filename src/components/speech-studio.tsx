"use client"

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react"
import {
  Download,
  KeyRound,
  Pause,
  Play,
  RotateCcw,
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
import {
  getApiKeyServerSnapshot,
  getApiKeySnapshot,
  persistApiKey,
  subscribeApiKey,
} from "@/lib/api-key-store"
import { formatPercent } from "@/lib/generation-progress"
import { useGenerationProgress } from "@/hooks/use-generation-progress"
import { cn } from "@/lib/utils"

type SpeechStudioProps = {
  hasServerKey: boolean
}

function maskKey(key: string): string {
  if (key.length < 8) return "ذخیره شده"
  return `${key.slice(0, 4)}…${key.slice(-4)}`
}

export function SpeechStudio({ hasServerKey }: SpeechStudioProps) {
  const [text, setText] = useState<string>(SAMPLE_TEXTS[0].text)
  const [voice, setVoice] = useState<string>(DEFAULT_VOICE)
  const [style, setStyle] = useState<StyleId>("natural")
  const apiKey = useSyncExternalStore(
    subscribeApiKey,
    getApiKeySnapshot,
    getApiKeyServerSnapshot,
  )
  const [draftKey, setDraftKey] = useState("")
  const [keyDialogOpen, setKeyDialogOpen] = useState(false)
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">(
    "idle",
  )
  const [error, setError] = useState("")
  const [timeoutOpen, setTimeoutOpen] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackProgress, setPlaybackProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const pendingUrlRef = useRef<string | null>(null)
  const generation = useGenerationProgress()

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl)
    }
  }, [audioUrl])

  const remaining = MAX_TEXT_CHARS - text.length
  const isLoading =
    status === "loading" ||
    generation.phase === "running" ||
    generation.phase === "finishing"
  const canSpeak = text.trim().length > 0 && !isLoading
  const needsKey = !hasServerKey && !apiKey

  const selectedVoice = useMemo(
    () => VOICES.find((item) => item.name === voice) ?? VOICES[0],
    [voice],
  )

  function clearPendingAudio() {
    if (pendingUrlRef.current) {
      URL.revokeObjectURL(pendingUrlRef.current)
      pendingUrlRef.current = null
    }
  }

  function restartSession() {
    abortRef.current?.abort()
    abortRef.current = null
    generation.reset()
    clearPendingAudio()
    setAudioUrl((previous) => {
      if (previous) URL.revokeObjectURL(previous)
      return null
    })
    setStatus("idle")
    setError("")
    setTimeoutOpen(false)
    setIsPlaying(false)
    setPlaybackProgress(0)
    setDuration(0)
  }

  function revealAudio(url: string) {
    setAudioUrl((previous) => {
      if (previous) URL.revokeObjectURL(previous)
      return url
    })
    setStatus("ready")
    requestAnimationFrame(() => {
      const player = audioRef.current
      if (!player) return
      player.src = url
      void player.play().then(
        () => setIsPlaying(true),
        () => setIsPlaying(false),
      )
    })
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

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    clearPendingAudio()
    setAudioUrl((previous) => {
      if (previous) URL.revokeObjectURL(previous)
      return null
    })
    setStatus("loading")
    setError("")
    setTimeoutOpen(false)
    setIsPlaying(false)
    setPlaybackProgress(0)
    setDuration(0)

    generation.start({
      onFinished: () => {
        const url = pendingUrlRef.current
        pendingUrlRef.current = null
        if (url) revealAudio(url)
      },
      onTimeout: () => {
        controller.abort()
        generation.reset()
        clearPendingAudio()
        setStatus("error")
        setTimeoutOpen(true)
      },
    })

    try {
      const headers: HeadersInit = { "Content-Type": "application/json" }
      if (apiKey) headers["x-gemini-api-key"] = apiKey

      const response = await fetch("/api/speak", {
        method: "POST",
        headers,
        body: JSON.stringify({ text: trimmed, voice, style }),
        signal: controller.signal,
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string
        } | null
        throw new Error(payload?.error || "تولید صدا ناموفق بود.")
      }

      const blob = await response.blob()
      if (controller.signal.aborted) {
        return
      }
      pendingUrlRef.current = URL.createObjectURL(blob)
      generation.complete()
    } catch (caught) {
      if (controller.signal.aborted) {
        return
      }
      generation.reset()
      clearPendingAudio()
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
            Gemini TTS · ویژه آرمان
          </Badge>
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            فارسی خوان مخصوص آرمان
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

        <Button
          variant={needsKey ? "default" : "outline"}
          size="lg"
          onClick={() => {
            setDraftKey(apiKey)
            setKeyDialogOpen(true)
          }}
        >
          <KeyRound data-icon="inline-start" />
          {hasServerKey && !apiKey
            ? "کلید سرور آماده است"
            : apiKey
              ? maskKey(apiKey)
              : "کلید API"}
        </Button>
        <Dialog open={keyDialogOpen} onOpenChange={setKeyDialogOpen}>
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
                  persistApiKey("")
                  setDraftKey("")
                  setKeyDialogOpen(false)
                }}
              >
                پاک کردن
              </Button>
              <Button
                onClick={() => {
                  persistApiKey(draftKey)
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
                  variant={text === sample.text ? "default" : "outline"}
                  disabled={isLoading}
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
              disabled={isLoading}
              placeholder="متن فارسی را اینجا بنویسید..."
              className="min-h-52 text-base leading-8 md:text-lg"
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>برچسب‌ها را انگلیسی بگذارید: [excited] [very slow]</span>
              <span>{remaining.toLocaleString("fa-IR")} نویسه مانده</span>
            </div>
            {status === "error" && !timeoutOpen ? (
              <p
                role="alert"
                className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {error}
              </p>
            ) : null}
            {isLoading ? (
              <div className="space-y-3 rounded-xl border bg-muted/40 p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">
                    در حال تولید فایل صوتی
                  </span>
                  <span className="tabular-nums text-muted-foreground">
                    {formatPercent(generation.percent)}
                  </span>
                </div>
                <div
                  className="h-3 overflow-hidden rounded-full bg-background"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.floor(generation.percent)}
                >
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{
                      width: `${Math.min(100, generation.percent)}%`,
                    }}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={restartSession}
                >
                  <RotateCcw data-icon="inline-start" />
                  ری استارت
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Button
                  size="lg"
                  className="h-11 w-full text-base"
                  onClick={() => void generateSpeech()}
                  disabled={!canSpeak}
                >
                  <Volume2 data-icon="inline-start" />
                  تولید فایل صوتی
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={restartSession}
                >
                  <RotateCcw data-icon="inline-start" />
                  ری استارت
                </Button>
              </div>
            )}
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
                  items={VOICES.map((item) => ({
                    value: item.name,
                    label: `${item.name} — ${item.mood}`,
                  }))}
                  modal={false}
                >
                  <SelectTrigger id="voice" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="start" alignItemWithTrigger={false}>
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
                  ? `تولید فایل صوتی · ${formatPercent(generation.percent)}`
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
                  setPlaybackProgress(0)
                }}
                onLoadedMetadata={(event) => {
                  setDuration(event.currentTarget.duration || 0)
                }}
                onTimeUpdate={(event) => {
                  const current = event.currentTarget.currentTime
                  const total = event.currentTarget.duration || 0
                  setPlaybackProgress(total ? current / total : 0)
                }}
              />
              <div className="flex items-center gap-3">
                <Button
                  size="icon-lg"
                  variant="outline"
                  onClick={togglePlayback}
                  disabled={!audioUrl || isLoading}
                  aria-label={isPlaying ? "توقف" : "پخش"}
                >
                  {isPlaying ? <Pause /> : <Play />}
                </Button>
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{
                        width: `${Math.round(
                          (isLoading ? generation.percent : playbackProgress * 100),
                        )}%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>
                      {isLoading
                        ? "در حال ساخت فایل"
                        : audioUrl
                          ? "WAV · ۲۴ کیلوهرتز"
                          : "منتظر تولید"}
                    </span>
                    <span>
                      {isLoading
                        ? formatPercent(generation.percent)
                        : formatTime(duration * playbackProgress)}
                    </span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  disabled={!audioUrl || isLoading}
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

      <Dialog
        open={timeoutOpen}
        disablePointerDismissal
        onOpenChange={(open) => {
          if (open) setTimeoutOpen(true)
        }}
      >
        <DialogContent className="sm:max-w-md" dir="rtl" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>خطا در تولید فایل</DialogTitle>
            <DialogDescription className="space-y-2 text-start leading-7">
              <span className="block">در تولید فایل مشکلی صورت گرفته.</span>
              <span className="block">
                لطفا دکمه‌ی ری استارت را بزنید و مجدد تلاش کنید.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button className="w-full sm:w-auto" onClick={restartSession}>
              <RotateCcw data-icon="inline-start" />
              ری استارت
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
