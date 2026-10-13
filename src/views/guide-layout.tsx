"use client"

import type { ReactNode } from "react"
import { ArrowRight } from "lucide-react"

import { Link } from "@/components/app-link"
import { useI18n } from "@/lib/i18n"

export function GuideLayout({ children }: { children: ReactNode }) {
  const { t, dir } = useI18n()
  return (
    <div className="min-h-screen bg-background" dir={dir}>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
          >
            <ArrowRight className="size-4" />
            {t("guide.backStudio")}
          </Link>
          <p className="rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
            {t("guide.badge")}
          </p>
        </div>
        {children}
      </div>
    </div>
  )
}
