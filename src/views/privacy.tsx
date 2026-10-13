"use client"

import { Link } from "@/components/app-link"
import { useI18n } from "@/lib/i18n"

export function PrivacyPage() {
  const { t, dir } = useI18n()
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10 sm:px-8" dir={dir}>
        <Link
          href="/"
          className="inline-flex w-fit items-center rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium hover:bg-muted"
        >
          {t("privacy.back")}
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">{t("privacy.title")}</h1>
        <p className="leading-8 text-muted-foreground">{t("privacy.intro")}</p>
        <section className="space-y-2 rounded-2xl border border-border bg-card p-5 leading-8">
          <h2 className="text-lg font-semibold">{t("privacy.local.title")}</h2>
          <p className="text-muted-foreground">{t("privacy.local.body")}</p>
        </section>
        <section className="space-y-2 rounded-2xl border border-border bg-card p-5 leading-8">
          <h2 className="text-lg font-semibold">{t("privacy.log.title")}</h2>
          <p className="text-muted-foreground">{t("privacy.log.body")}</p>
        </section>
        <section className="space-y-2 rounded-2xl border border-border bg-card p-5 leading-8">
          <h2 className="text-lg font-semibold">{t("privacy.google.title")}</h2>
          <p className="text-muted-foreground">{t("privacy.google.body")}</p>
        </section>
        <section className="space-y-2 rounded-2xl border border-border bg-card p-5 leading-8">
          <h2 className="text-lg font-semibold">{t("privacy.sale.title")}</h2>
          <p className="text-muted-foreground">{t("privacy.sale.body")}</p>
        </section>
      </div>
    </div>
  )
}
