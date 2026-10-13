"use client"

import { useState } from "react"

import { SpeechStudio } from "@/components/speech-studio"
import { StudioHeader } from "@/components/studio-header"
import { FeatureTabs, VideoToolsPanel } from "@/components/video-tools-panel"
import { requestOpenApiDialog } from "@/lib/api-key-store"
import { useI18n } from "@/lib/i18n"
import { Link } from "@/components/app-link"

type StudioTab = "tts" | "subtitles" | "dubbing"

export function PersianStudio() {
  const { t, dir } = useI18n()
  const [tab, setTab] = useState<StudioTab>("tts")

  return (
    <div className="mx-auto flex h-dvh min-h-0 w-full flex-col gap-3 overflow-hidden px-3 py-3 sm:px-4" dir={dir}>
      <header className="shrink-0 space-y-2">
        <StudioHeader />
        <p className="w-full max-w-none text-sm leading-7 text-muted-foreground sm:text-base">
          {tab === "tts" ? (
            <>
              {t("tts.intro1")}
              <br />
              {t("tts.intro2")}
              <br />
              {t("tts.intro3a")}{" "}
              <Link href="/guide" className="text-foreground underline underline-offset-4">
                {t("tts.intro3b")}
              </Link>{" "}
              {t("tts.intro3c")}
            </>
          ) : (
            t("app.tagline")
          )}
        </p>
        <FeatureTabs value={tab} onChange={setTab} />
      </header>

      {tab === "tts" ? (
        <SpeechStudio onNeedKey={requestOpenApiDialog} />
      ) : (
        <VideoToolsPanel mode={tab} onNeedKey={requestOpenApiDialog} />
      )}
    </div>
  )
}
