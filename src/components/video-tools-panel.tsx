"use client"

import { Captions, Volume2 } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { VoiceTable } from "@/components/voice-table"
import {
  getApiKeyServerSnapshot,
  getApiKeySnapshot,
  subscribeApiKey,
} from "@/lib/api-key-store"
import { DEFAULT_VOICE } from "@/lib/voices"
import { getStoredSync, setStored } from "@/lib/storage"
import { useI18n } from "@/lib/i18n"
import { useSyncExternalStore, useState } from "react"
import { cn } from "@/lib/utils"

const VOICE_KEY = "persian-studio.dub-voice"
const VOLUME_KEY = "persian-studio.original-volume"
const BILINGUAL_KEY = "persian-studio.bilingual"

type VideoToolsPanelProps = {
  mode: "subtitles" | "dubbing"
  onNeedKey: () => void
}

export function VideoToolsPanel({ mode, onNeedKey }: VideoToolsPanelProps) {
  const { t } = useI18n()
  const apiKey = useSyncExternalStore(
    subscribeApiKey,
    getApiKeySnapshot,
    getApiKeyServerSnapshot,
  )
  const [voice, setVoice] = useState(
    () => getStoredSync(VOICE_KEY, DEFAULT_VOICE) || DEFAULT_VOICE,
  )
  const [volume, setVolume] = useState(() => {
    const stored = Number(getStoredSync(VOLUME_KEY, "0.18"))
    return Number.isFinite(stored) ? stored : 0.18
  })
  const [bilingual, setBilingual] = useState(
    () => getStoredSync(BILINGUAL_KEY, "0") === "1",
  )

  function handleVoice(next: string) {
    setVoice(next)
    void setStored(VOICE_KEY, next)
  }

  function handleVolume(next: number) {
    setVolume(next)
    void setStored(VOLUME_KEY, String(next))
  }

  const isSubtitles = mode === "subtitles"

  return (
    <div className="grid min-h-0 flex-1 gap-3 overflow-y-auto lg:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)]">
      <Card className="bg-card/90 shadow-sm">
        <CardHeader>
          <CardTitle>
            {isSubtitles ? t("video.subtitles.title") : t("video.dubbing.title")}
          </CardTitle>
          <CardDescription>
            {isSubtitles ? t("video.subtitles.lead") : t("video.dubbing.lead")}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5">
          <div>
            <h2 className="text-base font-medium">{t("video.howTitle")}</h2>
            <ol className="mt-3 space-y-2 text-sm leading-7 text-muted-foreground">
              <li>۱. {t("video.step1")}</li>
              <li>۲. {t("video.step2")}</li>
              <li>۳. {isSubtitles ? t("video.step3sub") : t("video.step3dub")}</li>
            </ol>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href="https://www.youtube.com"
              target="_blank"
              rel="noreferrer"
              className={buttonVariants()}
            >
              {isSubtitles ? <Captions data-icon="inline-start" /> : <Volume2 data-icon="inline-start" />}
              {t("video.openYoutube")}
            </a>
          </div>
          <p className="text-sm leading-7 text-muted-foreground">
            {t("video.note")}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-5 pt-6">
          <div className="grid gap-2">
            <Label className="text-base">{t("video.voice")}</Label>
            <VoiceTable
              value={voice}
              onChange={handleVoice}
              apiKey={apiKey}
              onNeedKey={onNeedKey}
            />
          </div>
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label className="text-base">{t("video.originalVolume")}</Label>
              <span className="text-xs tabular-nums text-muted-foreground">
                {Math.round(volume * 100)}%
              </span>
            </div>
            <Slider
              min={0}
              max={1}
              step={0.01}
              value={[volume]}
              onValueChange={(value) => {
                const next = Array.isArray(value) ? value[0] : value
                handleVolume(Number(next) || 0)
              }}
            />
          </div>
          <label className="flex cursor-pointer items-start gap-2 text-sm leading-6">
            <input
              type="checkbox"
              className="mt-1 size-4 accent-primary"
              checked={bilingual}
              onChange={(event) => {
                setBilingual(event.target.checked)
                void setStored(BILINGUAL_KEY, event.target.checked ? "1" : "0")
              }}
            />
            <span>{t("video.bilingual")}</span>
          </label>
        </CardContent>
      </Card>
    </div>
  )
}

export function FeatureTabs({
  value,
  onChange,
}: {
  value: "tts" | "subtitles" | "dubbing"
  onChange: (next: "tts" | "subtitles" | "dubbing") => void
}) {
  const { t } = useI18n()
  const tabs = [
    { id: "tts" as const, label: t("tab.tts") },
    { id: "subtitles" as const, label: t("tab.subtitles") },
    { id: "dubbing" as const, label: t("tab.dubbing") },
  ]
  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={cn(
            "rounded-xl border px-3 py-1.5 text-sm font-medium transition-colors",
            value === tab.id
              ? "border-primary bg-accent text-foreground"
              : "border-border bg-background hover:bg-muted",
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
