"use client"

import { ArrowRight } from "lucide-react"

import { Link } from "@/components/app-link"
import { useI18n } from "@/lib/i18n"

export function AppGuidePage() {
  const { t, locale } = useI18n()
  const fa = locale !== "en"
  const sections = fa
    ? [
        {
          title: "متن به گفتار",
          body: "ستون راست تاریخچه است. متن را بنویس، صدا و سبک را انتخاب کن و فایل بساز. پخش، عقب و جلو، و دانلود WAV بعد از ساخت در دسترس است.",
        },
        {
          title: "زیرنویس فارسی",
          body: "روی یوتیوب پنل شناور Persian Studio ظاهر می‌شود. «زیرنویس فارسی» زیرنویس موجود را از هر زبان به فارسی ترجمه می‌کند و روی ویدیو نشان می‌دهد. اگر زیرنویس نباشد، از صدای تب استفاده می‌شود.",
        },
        {
          title: "دوبله فارسی",
          body: "همان پنل روی ویدیو دکمهٔ دوبله دارد. زمان‌بندی از زیرنویس گرفته می‌شود، هر تکه با Gemini به فارسی خوانده می‌شود و با تصویر همگام می‌ماند. صدای اصلی کم می‌شود.",
        },
        {
          title: "کلید API، زبان و تم",
          body: "از هدر کلید Gemini را وارد می‌کنی. زبان افزونه فارسی یا انگلیسی است (پیش‌فرض فارسی). تم پیش‌فرض تیره است؛ دکمه خورشید بالای صفحه حالت روشن را فعال می‌کند.",
        },
      ]
    : [
        {
          title: "Text to speech",
          body: "History sits on the side. Write text, pick a voice and style, then generate. Play, skip, and download WAV once it is ready.",
        },
        {
          title: "Persian subtitles",
          body: "A floating Persian Studio panel appears on YouTube. Persian subtitles translates existing captions from any language and overlays them. If there are no captions, tab audio is used.",
        },
        {
          title: "Persian dubbing",
          body: "The same panel can dub the video. Timing comes from captions, each line is spoken in Persian with Gemini, and original audio is ducked.",
        },
        {
          title: "API key, language, and theme",
          body: "Save your Gemini key from the header. The UI is Persian by default, with English as the second language. Dark mode is the default; the sun button switches to light mode.",
        },
      ]

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
          {t("guide.topic.app.title")}
        </h1>
        <p className="max-w-none text-pretty leading-8 text-muted-foreground">
          {fa
            ? "Persian Studio سه کار می‌کند: متن به گفتار، زیرنویس فارسی ویدیو، و دوبله فارسی. همه با همان کلید Gemini."
            : "Persian Studio does three things: text to speech, Persian subtitles, and Persian dubbing. All of them use the same Gemini key."}
        </p>
      </header>

      <div className="space-y-4">
        {sections.map((section) => (
          <section
            key={section.title}
            className="rounded-2xl border border-border bg-card p-5"
          >
            <h2 className="text-lg font-semibold">{section.title}</h2>
            <p className="mt-2 leading-8 text-muted-foreground">{section.body}</p>
          </section>
        ))}
      </div>
    </>
  )
}
