"use client"

import { BookOpen, KeyRound, LayoutPanelTop, Tags } from "lucide-react"

import { Link } from "@/components/app-link"
import { useI18n } from "@/lib/i18n"

export function GuideHubPage() {
  const { t } = useI18n()
  const topics = [
    {
      href: "/guide/api",
      title: t("guide.topic.api.title"),
      description: t("guide.topic.api.desc"),
      icon: KeyRound,
    },
    {
      href: "/guide/app",
      title: t("guide.topic.app.title"),
      description: t("guide.topic.app.desc"),
      icon: LayoutPanelTop,
    },
    {
      href: "/guide/tags",
      title: t("guide.topic.tags.title"),
      description: t("guide.topic.tags.desc"),
      icon: Tags,
    },
  ]

  return (
    <>
      <header className="space-y-3">
        <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <BookOpen className="size-4" />
          {t("app.name")}
        </p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {t("guide.hub.title")}
        </h1>
        <p className="max-w-none text-pretty leading-8 text-muted-foreground">
          {t("guide.hub.lead")}
        </p>
      </header>

      <ol className="grid gap-4">
        {topics.map((topic, index) => {
          const Icon = topic.icon
          return (
            <li key={topic.href}>
              <Link
                href={topic.href}
                className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/40 hover:bg-muted/40"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1 space-y-1">
                  <span className="flex items-center gap-2 text-lg font-semibold">
                    <Icon className="size-4 text-primary" />
                    {topic.title}
                  </span>
                  <span className="block text-sm leading-7 text-muted-foreground">
                    {topic.description}
                  </span>
                </span>
              </Link>
            </li>
          )
        })}
      </ol>
    </>
  )
}
