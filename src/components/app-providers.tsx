"use client"

import { useEffect } from "react"
import type { ReactNode } from "react"

import { DirectionProvider } from "@/components/ui/direction"
import { I18nProvider, useI18n } from "@/lib/i18n"

function DirectionGate({ children }: { children: ReactNode }) {
  const { dir } = useI18n()
  return <DirectionProvider direction={dir}>{children}</DirectionProvider>
}

export function AppProviders({ children }: { children: ReactNode }) {
  useEffect(() => {
    document.documentElement.classList.add("ps-ready")
  }, [])

  return (
    <I18nProvider>
      <DirectionGate>{children}</DirectionGate>
    </I18nProvider>
  )
}
