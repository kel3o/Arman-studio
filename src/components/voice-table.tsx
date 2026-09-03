"use client"

import { useEffect, useRef, useState } from "react"
import { Popover } from "@base-ui/react/popover"
import { Check, ChevronDown, Loader2, Pause, Play } from "lucide-react"

import {
  DEFAULT_VOICE,
  VOICE_GROUPS,
  VOICE_PREVIEW_TEXT,
  VOICES,
  type VoiceOption,
} from "@/lib/voices"
import { cn } from "@/lib/utils"

type VoiceTableProps = {
  value: string
  onChange: (name: string) => void
  disabled?: boolean
  apiKey: string
  hasServerKey: boolean
  onNeedKey: () => void
}

const VOICE_COLS =
  "grid-cols-[minmax(0,1.15fr)_minmax(0,1.35fr)_minmax(0,0.7fr)_2.75rem]"

export function VoiceTable({
  value,
  onChange,
  disabled,
  apiKey,
  hasServerKey,
  onNeedKey,
}: VoiceTableProps) {
  const [open, setOpen] = useState(false)
  const [playingVoice, setPlayingVoice] = useState<string | null>(null)
  const [loadingVoice, setLoadingVoice] = useState<string | null>(null)
  const [previewError, setPreviewError] = useState("")
  const cacheRef = useRef(new Map<string, string>())
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const selected =
    VOICES.find((item) => item.name === value) ??
    VOICES.find((item) => item.name === DEFAULT_VOICE) ??
    VOICES[0]

  useEffect(() => {
    const cache = cacheRef.current
    return () => {
      abortRef.current?.abort()
      audioRef.current?.pause()
      audioRef.current = null
      for (const url of cache.values()) URL.revokeObjectURL(url)
      cache.clear()
    }
  }, [])

  function playUrl(name: string, url: string) {
    audioRef.current?.pause()
    const player = new Audio(url)
    audioRef.current = player
    player.onended = () => {
      if (audioRef.current === player) {
        setPlayingVoice(null)
      }
    }
    void player.play().then(
      () => setPlayingVoice(name),
      () => setPlayingVoice(null),
    )
  }

  async function previewVoice(name: string) {
    if (disabled) return
    setPreviewError("")

    if (playingVoice === name) {
      audioRef.current?.pause()
      setPlayingVoice(null)
      return
    }

    const cached = cacheRef.current.get(name)
    if (cached) {
      playUrl(name, cached)
      return
    }

    if (!hasServerKey && !apiKey) {
      onNeedKey()
      return
    }

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    audioRef.current?.pause()
    setPlayingVoice(null)
    setLoadingVoice(name)

    try {
      const headers: HeadersInit = { "Content-Type": "application/json" }
      if (apiKey) headers["x-gemini-api-key"] = apiKey

      const response = await fetch("/api/speak", {
        method: "POST",
        headers,
        body: JSON.stringify({
          text: VOICE_PREVIEW_TEXT,
          voice: name,
          style: "natural",
        }),
        signal: controller.signal,
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string
        } | null
        throw new Error(payload?.error || "پخش نمونه ناموفق بود.")
      }

      const blob = await response.blob()
      if (controller.signal.aborted) return
      const url = URL.createObjectURL(blob)
      const previous = cacheRef.current.get(name)
      if (previous) URL.revokeObjectURL(previous)
      cacheRef.current.set(name, url)
      setLoadingVoice(null)
      playUrl(name, url)
    } catch (caught) {
      if (controller.signal.aborted) return
      setLoadingVoice(null)
      setPreviewError(
        caught instanceof Error ? caught.message : "پخش نمونه ناموفق بود.",
      )
    }
  }

  return (
    <div className="grid gap-1.5">
      <Popover.Root
        open={open}
        onOpenChange={(next) => {
          if (disabled) return
          setOpen(next)
        }}
      >
        <Popover.Trigger
          disabled={disabled}
          className={cn(
            "flex w-full cursor-pointer items-center gap-2 rounded-xl border border-input bg-background px-3 py-2 text-sm transition-colors outline-none",
            "hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
            "disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          <span className="grid min-w-0 flex-1 grid-cols-3 items-center gap-2 text-center">
            <span className="truncate text-xs font-medium">{selected.name}</span>
            <span className="truncate text-muted-foreground">{selected.mood}</span>
            <span className="truncate text-muted-foreground">{selected.gender}</span>
          </span>
          <ChevronDown
            className={cn(
              "size-4 shrink-0 text-muted-foreground transition-transform",
              open && "rotate-180",
            )}
          />
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner
            side="bottom"
            sideOffset={6}
            align="start"
            className="isolate z-50"
          >
            <Popover.Popup
              dir="rtl"
              className="min-w-[28rem] w-(--anchor-width) origin-(--transform-origin) overflow-hidden rounded-xl bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95"
            >
              <div className="max-h-72 overflow-auto [scrollbar-gutter:stable]">
                <div className={cn("grid w-full", VOICE_COLS)}>
                  <div className="sticky top-0 z-10 bg-muted px-2 py-2 text-center text-xs font-medium text-muted-foreground backdrop-blur-sm">
                    اسم
                  </div>
                  <div className="sticky top-0 z-10 bg-muted px-2 py-2 text-center text-xs font-medium text-muted-foreground backdrop-blur-sm">
                    حس صدا
                  </div>
                  <div className="sticky top-0 z-10 bg-muted px-2 py-2 text-center text-xs font-medium text-muted-foreground backdrop-blur-sm">
                    جنسیت
                  </div>
                  <div className="sticky top-0 z-10 bg-muted px-1 py-2 text-center text-xs font-medium text-muted-foreground backdrop-blur-sm">
                    تست
                  </div>
                  {VOICE_GROUPS.map((group) => {
                    const voices = VOICES.filter((item) => item.group === group)
                    return (
                      <VoiceGroup
                        key={group}
                        group={group}
                        voices={voices}
                        value={value}
                        disabled={disabled}
                        playingVoice={playingVoice}
                        loadingVoice={loadingVoice}
                        onChange={(name) => {
                          onChange(name)
                          setOpen(false)
                        }}
                        onPreview={previewVoice}
                      />
                    )
                  })}
                </div>
              </div>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
      {previewError ? (
        <p role="alert" className="text-xs text-destructive">
          {previewError}
        </p>
      ) : null}
    </div>
  )
}

function VoiceGroup({
  group,
  voices,
  value,
  disabled,
  playingVoice,
  loadingVoice,
  onChange,
  onPreview,
}: {
  group: string
  voices: readonly VoiceOption[]
  value: string
  disabled?: boolean
  playingVoice: string | null
  loadingVoice: string | null
  onChange: (name: string) => void
  onPreview: (name: string) => void
}) {
  return (
    <>
      <div className="col-span-4 bg-accent px-2 py-1.5 text-center text-[11px] font-bold text-accent-foreground">
        {group}
      </div>
      {voices.map((voice, index) => (
        <VoiceRow
          key={voice.name}
          voice={voice}
          selected={voice.name === value}
          zebra={index % 2 === 1}
          disabled={disabled}
          playing={playingVoice === voice.name}
          loading={loadingVoice === voice.name}
          onSelect={() => onChange(voice.name)}
          onPreview={() => onPreview(voice.name)}
        />
      ))}
    </>
  )
}

function VoiceRow({
  voice,
  selected,
  zebra,
  disabled,
  playing,
  loading,
  onSelect,
  onPreview,
}: {
  voice: VoiceOption
  selected: boolean
  zebra: boolean
  disabled?: boolean
  playing: boolean
  loading: boolean
  onSelect: () => void
  onPreview: () => void
}) {
  return (
    <div
      className={cn(
        "col-span-4 grid cursor-pointer border-b border-border/70 transition-colors",
        VOICE_COLS,
        zebra && !selected && "bg-muted/40",
        selected && "bg-primary/12",
        !selected && "hover:bg-primary/14",
        disabled && "pointer-events-none opacity-60",
      )}
      onClick={onSelect}
    >
      <div className="flex items-center justify-center px-1.5 py-1.5 text-center">
        <span className="flex w-full min-w-0 items-center justify-center gap-1">
          {selected ? (
            <Check className="size-3.5 shrink-0 text-primary" />
          ) : (
            <span className="size-3.5 shrink-0" />
          )}
          <span className="truncate text-xs font-medium">{voice.name}</span>
        </span>
      </div>
      <div className="truncate px-1.5 py-1.5 text-center text-[11px] text-muted-foreground">
        {voice.mood}
      </div>
      <div className="px-1.5 py-1.5 text-center text-[11px] text-muted-foreground">
        {voice.gender}
      </div>
      <div className="flex items-center justify-center px-0.5 py-1.5">
        <button
          type="button"
          className="inline-flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-md text-foreground hover:bg-background/80"
          aria-label={
            loading
              ? `در حال آماده کردن صدای ${voice.name}`
              : playing
                ? `توقف نمونهٔ ${voice.name}`
                : `پخش نمونهٔ ${voice.name}`
          }
          disabled={disabled}
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
            onPreview()
          }}
        >
          {loading ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : playing ? (
            <Pause className="size-3.5" />
          ) : (
            <Play className="size-3.5" />
          )}
        </button>
      </div>
    </div>
  )
}
