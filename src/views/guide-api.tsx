"use client"

import { ArrowRight } from "lucide-react"

import { Link } from "@/components/app-link"
import { useI18n } from "@/lib/i18n"

export function GeminiApiGuidePage() {
  const { t, locale } = useI18n()
  const fa = locale !== "en"
  return (
    <>
      <Link
        href="/guide"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowRight className="size-4" />
        {t("guide.backList")}
      </Link>
      <header className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {t("guide.topic.api.title")}
        </h1>
        <p className="max-w-none text-pretty leading-8 text-muted-foreground">
          {fa
            ? "Persian Studio صدا، زیرنویس و دوبله را با Gemini می‌سازد. برای این کار به یک کلید API از Google AI Studio نیاز داری. کلید روی همین مرورگر ذخیره می‌شود."
            : "Persian Studio builds speech, subtitles, and dubbing with Gemini. You need an API key from Google AI Studio. The key stays in this browser."}
        </p>
      </header>

      <ol className="space-y-6 text-pretty leading-8">
        <li className="rounded-2xl border border-border bg-card p-5">
          <p className="font-semibold">
            {fa ? "۱. ورود به Google AI Studio" : "1. Open Google AI Studio"}
          </p>
          <p className="mt-2 text-muted-foreground">
            {fa ? "به " : "Go to the "}
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              {fa ? "صفحه کلیدهای API" : "API keys page"}
            </a>
            {fa ? " برو و با حساب گوگل وارد شو." : " and sign in with Google."}
          </p>
        </li>
        <li className="rounded-2xl border border-border bg-card p-5">
          <p className="font-semibold">
            {fa ? "۲. ساخت کلید" : "2. Create a key"}
          </p>
          <p className="mt-2 text-muted-foreground">
            {fa
              ? "روی Create API key بزن. اگر پروژه‌ای نداری، گوگل یکی می‌سازد. کلید را کپی کن؛ معمولاً با "
              : "Click Create API key. If you have no project, Google creates one. Copy the key; it usually starts with "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm">
              AIza
            </code>
            {fa ? " شروع می‌شود." : "."}
          </p>
        </li>
        <li className="rounded-2xl border border-border bg-card p-5">
          <p className="font-semibold">
            {fa ? "۳. ثبت در افزونه" : "3. Save it in the extension"}
          </p>
          <p className="mt-2 text-muted-foreground">
            {fa
              ? "به استودیو برگرد، دکمه «کلید API» را بزن، کلید را در کادر بچسبان و ذخیره کن. اگر کلید درست باشد پیام موفقیت می‌بینی. با ذخیره، IP و روز و ساعت هم در جدول سازنده ثبت می‌شود."
              : "Back in the studio, open API key, paste it, and save. A success message appears. Saving also logs your IP, date, and time in the maker’s table."}
          </p>
        </li>
        <li className="rounded-2xl border border-border bg-card p-5">
          <p className="font-semibold">
            {fa ? "۴. اگر خطا گرفتی" : "4. If it fails"}
          </p>
          <p className="mt-2 text-muted-foreground">
            {fa
              ? "کلید خالی، کلید ناقص، یا کلید بدون دسترسی به مدل‌های Gemini رایج‌ترین علت‌ها هستند. کلید را دوباره از AI Studio کپی کن و مطمئن شو مدل‌های Gemini برای آن پروژه فعال‌اند."
              : "Empty, truncated, or unscoped keys are the usual causes. Copy the key again from AI Studio and make sure Gemini models are enabled for that project."}
          </p>
        </li>
      </ol>
    </>
  )
}
