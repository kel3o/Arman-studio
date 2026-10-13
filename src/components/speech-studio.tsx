"use client"

import { useEffect, useRef, useState, useSyncExternalStore } from "react"
import {
  Download,
  Pause,
  Play,
  RotateCcw,
  Volume2,
} from "lucide-react"

import { ChatSidebar } from "@/components/chat-sidebar"
import { VoiceTable } from "@/components/voice-table"
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
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import {
  DEFAULT_EDITOR_TEXT,
  DEFAULT_VOICE,
  MAX_CUSTOM_STYLE_CHARS,
  MAX_TEXT_CHARS,
  STYLES,
  isSampleEditorText,
  speakableText,
  type StyleId,
} from "@/lib/voices"
import { getApiKeyServerSnapshot, getApiKeySnapshot, subscribeApiKey } from "@/lib/api-key-store"
import { useI18n, type MessageKey } from "@/lib/i18n"
import { requestSpeech } from "@/lib/speak"
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

function isStyleId(value: string): value is StyleId {
  return STYLES.some((item) => item.id === value)
}

export function SpeechStudio({
  onNeedKey,
}: {
  onNeedKey: () => void
}) {
  const { t, dir, locale } = useI18n()
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
  const [text, setText] = useState(DEFAULT_EDITOR_TEXT)
  const [voice, setVoice] = useState<string>(DEFAULT_VOICE)
  const [style, setStyle] = useState<StyleId>("natural")
  const [customStyle, setCustomStyle] = useState("")
  const [customDialogOpen, setCustomDialogOpen] = useState(false)
  const [draftCustomStyle, setDraftCustomStyle] = useState("")
  const [customStyleError, setCustomStyleError] = useState("")
  const apiKey = useSyncExternalStore(
    subscribeApiKey,
    getApiKeySnapshot,
    getApiKeyServerSnapshot,
  )
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

  const spokenText = speakableText(text)
  const remaining = MAX_TEXT_CHARS - spokenText.length
  const isSampleText = isSampleEditorText(text)
  const isLoading =
    status === "loading" ||
    generation.phase === "running" ||
    generation.phase === "finishing"
  const canSpeak = spokenText.trim().length > 0 && !isLoading
  const needsKey = !apiKey
  const canSeek = Boolean(audioUrl) && !isLoading && duration > 0

  const activeChat = chats.find((item) => item.id === activeId)
  if (activeChat && activeId !== loadedChatId) {
    setLoadedChatId(activeId)
    setText(activeChat.text || DEFAULT_EDITOR_TEXT)
    setVoice(activeChat.voice)
    setStyle(isStyleId(activeChat.style) ? activeChat.style : "natural")
    setCustomStyle(activeChat.customStyle ?? "")
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
    const previousHtmlOverflow = document.documentElement.style.overflow
    const previousBodyOverflow = document.body.style.overflow
    document.documentElement.style.overflow = "hidden"
    document.body.style.overflow = "hidden"
    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow
      document.body.style.overflow = previousBodyOverflow
    }
  }, [])

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
      void updateChat(activeId, { text, voice, style, customStyle })
    }, 400)
    return () => window.clearTimeout(handle)
  }, [activeId, loadedChatId, text, voice, style, customStyle])

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
    setText(DEFAULT_EDITOR_TEXT)
    setVoice(DEFAULT_VOICE)
    setStyle("natural")
    setCustomStyle("")
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
    const trimmed = spokenText.trim()
    if (!trimmed) {
      setStatus("error")
      setError(t("editor.empty"))
      return
    }
    if (needsKey) {
      setStatus("error")
      setError(t("api.need"))
      onNeedKey()
      return
    }
    if (style === "custom" && !customStyle.trim()) {
      setStatus("error")
      setError(t("editor.customNeeded"))
      setDraftCustomStyle(customStyle)
      setCustomStyleError(t("custom.empty"))
      setCustomDialogOpen(true)
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
      void updateChat(activeId, { text, voice, style, customStyle })
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
      const blob = await requestSpeech({
        text: trimmed,
        voice,
        style,
        customStyle: style === "custom" ? customStyle : "",
        apiKey,
        signal: controller.signal,
      })
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
        caught instanceof Error ? caught.message : t("timeout.title"),
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

  async function retryFresh() {
    abortRef.current?.abort()
    try {
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations()
        await Promise.all(
          registrations.map((registration) => registration.unregister()),
        )
      }
      if ("caches" in window) {
        const keys = await caches.keys()
        await Promise.all(keys.map((key) => caches.delete(key)))
      }
    } catch {
      // Still reload even if cache APIs are blocked.
    }
    const url = new URL(window.location.href)
    url.searchParams.set("reload", String(Date.now()))
    window.location.replace(url.toString())
  }

  function openCustomStyleDialog() {
    setDraftCustomStyle(customStyle)
    setCustomStyleError("")
    setCustomDialogOpen(true)
  }

  function handleStyleClick(id: StyleId) {
    if (id === "custom") {
      openCustomStyleDialog()
      return
    }
    setStyle(id)
  }

  function saveCustomStyle() {
    const trimmed = draftCustomStyle.trim().slice(0, MAX_CUSTOM_STYLE_CHARS)
    if (!trimmed) {
      setCustomStyleError(t("custom.empty"))
      return
    }
    setCustomStyle(trimmed)
    setStyle("custom")
    setCustomStyleError("")
    setCustomDialogOpen(false)
  }

  return (
    <>
      <Dialog
        open={customDialogOpen}
        onOpenChange={(open) => {
          setCustomDialogOpen(open)
          if (!open) setCustomStyleError("")
        }}
      >
        <DialogContent className="sm:max-w-md" dir={dir}>
          <DialogHeader>
            <DialogTitle>{t("custom.title")}</DialogTitle>
            <DialogDescription>{t("custom.description")}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="custom-style">{t("custom.label")}</Label>
            <Textarea
              id="custom-style"
              dir={dir}
              rows={4}
              maxLength={MAX_CUSTOM_STYLE_CHARS}
              value={draftCustomStyle}
              onChange={(event) => {
                setDraftCustomStyle(
                  event.target.value.slice(0, MAX_CUSTOM_STYLE_CHARS),
                )
                setCustomStyleError("")
              }}
              placeholder={t("custom.placeholder")}
              className="min-h-24 resize-none text-sm leading-7"
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {(MAX_CUSTOM_STYLE_CHARS - draftCustomStyle.length).toLocaleString(
                  locale === "en" ? "en-US" : "fa-IR",
                )}{" "}
                {t("custom.remaining")}
              </span>
            </div>
            {customStyleError ? (
              <p role="alert" className="text-sm text-destructive">
                {customStyleError}
              </p>
            ) : null}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCustomDialogOpen(false)}
            >
              {t("custom.cancel")}
            </Button>
            <Button onClick={saveCustomStyle}>{t("custom.ok")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-y-auto lg:grid-cols-[16rem_minmax(0,1fr)_minmax(20rem,22rem)] lg:grid-rows-[minmax(0,1fr)] lg:items-stretch lg:overflow-hidden">
        <ChatSidebar
          chats={chats}
          activeId={activeId}
          disabled={isLoading}
          onNewChat={() => void handleNewChat()}
          onSelect={handleSelectChat}
          onDelete={handleDeleteChat}
          onRename={handleRenameChat}
        />

        <Card className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] overflow-hidden bg-card/90 shadow-sm max-lg:h-[min(28rem,70vh)]">
          <CardHeader className="border-b">
            <CardTitle>{t("editor.title")}</CardTitle>
            <CardDescription>{t("editor.description")}</CardDescription>
          </CardHeader>
          <CardContent className="grid min-h-0 grid-rows-[minmax(0,1fr)_auto] gap-3 overflow-hidden pt-4">
            <Textarea
              value={text}
              onChange={(event) =>
                setText(event.target.value.slice(0, MAX_TEXT_CHARS))
              }
              dir={dir}
              disabled={isLoading}
              placeholder={t("editor.placeholder")}
              className={cn(
                "h-full min-h-0 resize-none overflow-y-auto [field-sizing:fixed] text-base leading-8 md:text-lg",
                isSampleText && "text-neutral-500",
              )}
            />
            <div className="grid shrink-0 gap-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{t("editor.tagsHint")}</span>
                <span>
                  {remaining.toLocaleString(locale === "en" ? "en-US" : "fa-IR")}{" "}
                  {t("editor.charsLeft")}
                </span>
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
                      {t("progress.title")}
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
                    onClick={() => void retryFresh()}
                  >
                    <RotateCcw data-icon="inline-start" />
                    {t("progress.retry")}
                  </Button>
                </div>
              ) : (
                <div className="grid gap-2">
                  <Button
                    size="lg"
                    className="h-11 w-full text-base"
                    onClick={() => void generateSpeech()}
                    disabled={!canSpeak}
                  >
                    <Volume2 data-icon="inline-start" />
                    {t("speak.generate")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => void retryFresh()}
                  >
                    <RotateCcw data-icon="inline-start" />
                    {t("progress.retry")}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex h-full min-h-0 flex-col gap-3 overflow-hidden max-lg:h-auto">
          <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <CardContent className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto">
              <div className="grid gap-2">
                <Label className="text-base">{t("voice.label")}</Label>
                <VoiceTable
                  value={voice}
                  disabled={isLoading}
                  onChange={setVoice}
                  apiKey={apiKey}
                  onNeedKey={onNeedKey}
                />
              </div>

              <div className="grid gap-2">
                <Label className="text-base">{t("style.label")}</Label>
                <div className="grid grid-cols-2 gap-2">
                  {STYLES.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleStyleClick(item.id)}
                      className={cn(
                        "cursor-pointer rounded-xl border px-2.5 py-1.5 text-start transition-colors",
                        style === item.id
                          ? "border-primary bg-accent text-foreground"
                          : "border-border bg-background hover:bg-muted",
                      )}
                    >
                      <div className="text-sm font-medium">
                        {t(`style.${item.id}.label` as MessageKey)}
                      </div>
                      <div className="line-clamp-2 text-xs text-muted-foreground">
                        {item.id === "custom" && customStyle
                          ? customStyle
                          : t(`style.${item.id}.hint` as MessageKey)}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label className="text-base">{t("player.label")}</Label>
                  <span className="text-xs text-muted-foreground">
                    {isLoading
                      ? `${t("player.loading")} · ${formatPercent(generation.percent)}`
                      : audioUrl
                        ? t("player.ready")
                        : t("player.empty")}
                  </span>
                </div>
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
                <div className="flex min-w-0 flex-col gap-1.5" dir="ltr">
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
                <div className="grid grid-cols-4 gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 min-w-0 px-1.5 text-xs"
                    disabled={!canSeek}
                    onClick={() => skip(-10)}
                  >
                    {t("player.back")}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 min-w-0 px-1.5"
                    onClick={togglePlayback}
                    disabled={!audioUrl || isLoading}
                    aria-label={isPlaying ? t("player.pause") : t("player.play")}
                  >
                    {isPlaying ? <Pause /> : <Play />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 min-w-0 px-1.5 text-xs"
                    disabled={!canSeek}
                    onClick={() => skip(10)}
                  >
                    {t("player.forward")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 min-w-0 px-1.5 text-xs"
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
                    {t("player.download")}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog
        open={timeoutOpen}
        disablePointerDismissal
        onOpenChange={(open) => {
          if (open) setTimeoutOpen(true)
        }}
      >
        <DialogContent className="sm:max-w-md" dir={dir} showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>{t("timeout.title")}</DialogTitle>
            <DialogDescription className="space-y-2 text-start leading-7">
              <span className="block">{t("timeout.body1")}</span>
              <span className="block">{t("timeout.body2")}</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              className="w-full sm:w-auto"
              onClick={() => void retryFresh()}
            >
              <RotateCcw data-icon="inline-start" />
              {t("progress.retry")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
