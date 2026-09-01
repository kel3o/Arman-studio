"use client"

import { useEffect, useRef, useState, useSyncExternalStore } from "react"
import Link from "next/link"
import {
  BookOpen,
  CheckCircle2,
  Download,
  KeyRound,
  Pause,
  Play,
  RotateCcw,
  Undo2,
  Redo2,
  Volume2,
} from "lucide-react"

import { ChatSidebar } from "@/components/chat-sidebar"
import { VoiceTable } from "@/components/voice-table"
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
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import {
  DEFAULT_VOICE,
  MAX_TEXT_CHARS,
  STYLES,
  type StyleId,
} from "@/lib/voices"
import {
  getApiKeyServerSnapshot,
  getApiKeySnapshot,
  persistApiKey,
  subscribeApiKey,
} from "@/lib/api-key-store"
import {
  createChat,
  deleteChat,
  getActiveChatIdServerSnapshot,
  getActiveChatIdSnapshot,
  getChatsServerSnapshot,
  getChatsSnapshot,
  loadChatAudio,
  renameChat,
  saveChatAudio,
  selectChat,
  subscribeChats,
  updateChat,
} from "@/lib/chat-store"
import {
  formatPercent,
  formatTime,
  loadingDurationMs,
} from "@/lib/generation-progress"
import { useGenerationProgress } from "@/hooks/use-generation-progress"
import { cn } from "@/lib/utils"

type SpeechStudioProps = {
  hasServerKey: boolean
}

function maskKey(key: string): string {
  if (key.length < 8) return "ذخیره شده"
  return `${key.slice(0, 4)}…${key.slice(-4)}`
}

function isStyleId(value: string): value is StyleId {
  return STYLES.some((item) => item.id === value)
}

export function SpeechStudio({ hasServerKey }: SpeechStudioProps) {
  const chats = useSyncExternalStore(
    subscribeChats,
    getChatsSnapshot,
    getChatsServerSnapshot,
  )
  const activeId = useSyncExternalStore(
    subscribeChats,
    getActiveChatIdSnapshot,
    getActiveChatIdServerSnapshot,
  )
  const [text, setText] = useState("")
  const [voice, setVoice] = useState<string>(DEFAULT_VOICE)
  const [style, setStyle] = useState<StyleId>("natural")
  const apiKey = useSyncExternalStore(
    subscribeApiKey,
    getApiKeySnapshot,
    getApiKeyServerSnapshot,
  )
  const [draftKey, setDraftKey] = useState("")
  const [keyDialogOpen, setKeyDialogOpen] = useState(false)
  const [keyError, setKeyError] = useState("")
  const [keySuccess, setKeySuccess] = useState(false)
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">(
    "idle",
  )
  const [error, setError] = useState("")
  const [timeoutOpen, setTimeoutOpen] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const pendingUrlRef = useRef<string | null>(null)
  const pendingBlobRef = useRef<Blob | null>(null)
  const activeIdRef = useRef(activeId)
  const autoplayRef = useRef(false)
  const audioLoadSeqRef = useRef(0)
  const [loadedChatId, setLoadedChatId] = useState("")
  const generation = useGenerationProgress()

  const remaining = MAX_TEXT_CHARS - text.length
  const isLoading =
    status === "loading" ||
    generation.phase === "running" ||
    generation.phase === "finishing"
  const canSpeak = text.trim().length > 0 && !isLoading
  const needsKey = !hasServerKey && !apiKey
  const canSeek = Boolean(audioUrl) && !isLoading && duration > 0

  const activeChat = chats.find((item) => item.id === activeId)
  if (activeChat && activeId !== loadedChatId) {
    setLoadedChatId(activeId)
    setText(activeChat.text)
    setVoice(activeChat.voice)
    setStyle(isStyleId(activeChat.style) ? activeChat.style : "natural")
    setError("")
    setTimeoutOpen(false)
    setIsPlaying(false)
    setCurrentTime(0)
    setDuration(activeChat.duration || 0)
    setStatus(activeChat.hasAudio ? "ready" : "idle")
    setAudioUrl((previous) => {
      if (previous) URL.revokeObjectURL(previous)
      return null
    })
  }

  function replaceAudioUrl(next: string | null) {
    setAudioUrl((previous) => {
      if (previous) URL.revokeObjectURL(previous)
      return next
    })
  }

  useEffect(() => {
    activeIdRef.current = activeId
  }, [activeId])

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl)
    }
  }, [audioUrl])

  useEffect(() => {
    const seq = ++audioLoadSeqRef.current
    autoplayRef.current = false
    if (!activeId) return
    let cancelled = false
    void loadChatAudio(activeId).then((blob) => {
      if (cancelled || seq !== audioLoadSeqRef.current) return
      if (!blob || activeIdRef.current !== activeId) return
      const url = URL.createObjectURL(blob)
      replaceAudioUrl(url)
      setStatus("ready")
    })
    return () => {
      cancelled = true
    }
  }, [activeId])

  useEffect(() => {
    if (!activeId || loadedChatId !== activeId) return
    const handle = window.setTimeout(() => {
      void updateChat(activeId, { text, voice, style })
    }, 400)
    return () => window.clearTimeout(handle)
  }, [activeId, loadedChatId, text, voice, style])

  function clearPendingAudio() {
    if (pendingUrlRef.current) {
      URL.revokeObjectURL(pendingUrlRef.current)
      pendingUrlRef.current = null
    }
    pendingBlobRef.current = null
  }

  function stopPlayer() {
    autoplayRef.current = false
    audioRef.current?.pause()
  }

  function restartSession() {
    audioLoadSeqRef.current += 1
    abortRef.current?.abort()
    abortRef.current = null
    generation.reset()
    clearPendingAudio()
    stopPlayer()
    replaceAudioUrl(null)
    setStatus("idle")
    setError("")
    setTimeoutOpen(false)
    setIsPlaying(false)
    setCurrentTime(0)
    setDuration(0)
  }

  function revealAudio(url: string) {
    audioLoadSeqRef.current += 1
    autoplayRef.current = true
    replaceAudioUrl(url)
    setStatus("ready")
  }

  function playAudio() {
    const player = audioRef.current
    if (!player) return
    const attempt = player.play()
    if (!attempt) return
    void attempt.then(
      () => setIsPlaying(true),
      (reason: unknown) => {
        const name =
          reason && typeof reason === "object" && "name" in reason
            ? String(reason.name)
            : ""
        if (name === "AbortError") return
        setIsPlaying(false)
      },
    )
  }

  async function handleNewChat() {
    restartSession()
    const chat = await createChat()
    setLoadedChatId(chat.id)
    setText("")
    setVoice(DEFAULT_VOICE)
    setStyle("natural")
  }

  function handleSelectChat(id: string) {
    if (id === activeId || isLoading) return
    abortRef.current?.abort()
    generation.reset()
    clearPendingAudio()
    stopPlayer()
    selectChat(id)
  }

  function handleDeleteChat(id: string) {
    if (isLoading) return
    if (id === activeId) restartSession()
    void deleteChat(id)
  }

  function handleRenameChat(id: string, title: string) {
    void renameChat(id, title)
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
    audioLoadSeqRef.current += 1
    stopPlayer()
    clearPendingAudio()
    replaceAudioUrl(null)
    setStatus("loading")
    setError("")
    setTimeoutOpen(false)
    setIsPlaying(false)
    setCurrentTime(0)
    setDuration(0)
    if (activeId) {
      void updateChat(activeId, { text: trimmed, voice, style })
    }

    generation.start({
      durationMs: loadingDurationMs(trimmed.length),
      onFinished: () => {
        const url = pendingUrlRef.current
        const blob = pendingBlobRef.current
        pendingUrlRef.current = null
        pendingBlobRef.current = null
        if (url) revealAudio(url)
        const chatId = activeIdRef.current
        if (blob && chatId) {
          void saveChatAudio(chatId, blob)
        }
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
      if (controller.signal.aborted) return
      pendingBlobRef.current = blob
      pendingUrlRef.current = URL.createObjectURL(blob)
      generation.complete()
    } catch (caught) {
      if (controller.signal.aborted) return
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
      playAudio()
    } else {
      player.pause()
      setIsPlaying(false)
    }
  }

  function seekTo(seconds: number) {
    const player = audioRef.current
    if (!player || !canSeek) return
    const next = Math.min(duration, Math.max(0, seconds))
    player.currentTime = next
    setCurrentTime(next)
  }

  function skip(delta: number) {
    seekTo(currentTime + delta)
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:py-12">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl space-y-3">
          <Badge variant="outline" className="border-primary/20 bg-accent/70">
            Gemini TTS · ویژه آرمان
          </Badge>
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            استدیو آرمان
          </h1>
          <p className="text-base leading-8 text-muted-foreground sm:text-lg">
            متن فارسی را بنویسید تا مدل گفتار Gemini آن را با لهجهٔ ایرانی
            بخواند. زبان را خودش تشخیص می‌دهد؛ برای کنترل لحن از برچسب‌های
            انگلیسی مثل{" "}
            <code className="rounded-md bg-muted px-1.5 py-0.5 text-sm">
              [whispers]
            </code>{" "}
            استفاده کنید. فهرست کامل در{" "}
            <Link href="/guide" className="text-foreground underline underline-offset-4">
              صفحه راهنما
            </Link>{" "}
            است.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="lg"
            nativeButton={false}
            render={<Link href="/guide" />}
          >
            <BookOpen data-icon="inline-start" />
            صفحه راهنما
          </Button>
          <Button
            variant={needsKey ? "default" : "outline"}
            size="lg"
            onClick={() => {
              setDraftKey(apiKey)
              setKeyError("")
              setKeySuccess(false)
              setKeyDialogOpen(true)
            }}
          >
            <KeyRound data-icon="inline-start" />
            {apiKey ? maskKey(apiKey) : "کلید API"}
          </Button>
        </div>
        <Dialog
          open={keyDialogOpen}
          onOpenChange={(open) => {
            setKeyDialogOpen(open)
            if (!open) {
              setKeyError("")
              setKeySuccess(false)
            }
          }}
        >
          <DialogContent className="sm:max-w-md" dir="rtl">
            <DialogHeader>
              <DialogTitle>کلید Gemini</DialogTitle>
              <DialogDescription>
                هر کاربر کلید خودش را از{" "}
                <a
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-foreground underline underline-offset-4"
                >
                  Google AI Studio
                </a>{" "}
                می‌گیرد و اینجا ذخیره می‌کند. کلید فقط در مرورگر شما می‌ماند.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-2">
              <Label htmlFor="api-key">API key</Label>
              <Input
                id="api-key"
                type="text"
                dir="ltr"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                data-1p-ignore="true"
                data-lpignore="true"
                placeholder="AIza..."
                value={draftKey}
                onChange={(event) => {
                  setDraftKey(event.target.value)
                  setKeyError("")
                  setKeySuccess(false)
                }}
              />
            </div>
            {keyError ? (
              <p role="alert" className="text-sm text-destructive">
                {keyError}
              </p>
            ) : null}
            {keySuccess ? (
              <p
                role="status"
                className="flex items-center gap-2 rounded-lg border border-primary/20 bg-accent px-3 py-2 text-sm text-foreground"
              >
                <CheckCircle2 className="size-4 shrink-0" />
                API با موفقیت ثبت شد
              </p>
            ) : null}
            <DialogFooter className="sm:justify-between">
              <Button
                variant="ghost"
                onClick={() => {
                  persistApiKey("")
                  setDraftKey("")
                  setKeySuccess(false)
                  setKeyError("")
                }}
              >
                پاک کردن
              </Button>
              {keySuccess ? (
                <Button
                  onClick={() => {
                    setKeyDialogOpen(false)
                    setKeyError("")
                    setKeySuccess(false)
                  }}
                >
                  تایید
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    if (!draftKey.trim()) {
                      setKeyError("کلید API را وارد کنید.")
                      return
                    }
                    persistApiKey(draftKey)
                    setKeyError("")
                    setKeySuccess(true)
                  }}
                >
                  ذخیره
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      <div className="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <ChatSidebar
          chats={chats}
          activeId={activeId}
          disabled={isLoading}
          onNewChat={() => void handleNewChat()}
          onSelect={handleSelectChat}
          onDelete={handleDeleteChat}
          onRename={handleRenameChat}
        />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,22rem)]">
          <Card className="bg-card/90 shadow-sm">
            <CardHeader className="border-b">
              <CardTitle>متن برای خواندن</CardTitle>
              <CardDescription>
                مدل باید دقیقاً همین متن را بلند بخواند، نه ترجمه کند.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 pt-4">
              <Textarea
                value={text}
                onChange={(event) =>
                  setText(event.target.value.slice(0, MAX_TEXT_CHARS))
                }
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
              <CardContent className="flex flex-col gap-5">
                <div className="grid gap-2">
                  <Label className="text-base">صدا</Label>
                  <VoiceTable
                    value={voice}
                    disabled={isLoading}
                    onChange={setVoice}
                  />
                </div>

                <div className="grid gap-2">
                  <Label className="text-base">سبک خواندن</Label>
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
                  src={audioUrl ?? undefined}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onEnded={() => {
                    setIsPlaying(false)
                    setCurrentTime(0)
                  }}
                  onCanPlay={() => {
                    if (!autoplayRef.current) return
                    autoplayRef.current = false
                    playAudio()
                  }}
                  onLoadedMetadata={(event) => {
                    const nextDuration = event.currentTarget.duration || 0
                    setDuration(nextDuration)
                    const chatId = activeIdRef.current
                    if (chatId && nextDuration) {
                      void updateChat(chatId, { duration: nextDuration })
                    }
                  }}
                  onTimeUpdate={(event) => {
                    setCurrentTime(event.currentTarget.currentTime || 0)
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
                  <div className="flex min-w-0 flex-1 flex-col gap-2" dir="ltr">
                    <Slider
                      min={0}
                      max={Math.max(duration, 0.1)}
                      step={0.1}
                      disabled={!canSeek}
                      value={[currentTime]}
                      onValueChange={(value) => {
                        const next = Array.isArray(value) ? value[0] : value
                        seekTo(Number(next) || 0)
                      }}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    disabled={!canSeek}
                    onClick={() => skip(-10)}
                  >
                    <Undo2 data-icon="inline-start" />
                    ۱۰ ثانیه عقب
                  </Button>
                  <Button
                    variant="outline"
                    disabled={!canSeek}
                    onClick={() => skip(10)}
                  >
                    <Redo2 data-icon="inline-start" />
                    ۱۰ ثانیه جلو
                  </Button>
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
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

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
