import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function GeminiApiGuidePage() {
  return (
    <>
      <Link
        href="/guide"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowRight className="size-4" />
        بازگشت به فهرست راهنما
      </Link>
      <header className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          دریافت و اتصال API از Gemini
        </h1>
        <p className="max-w-none text-pretty leading-8 text-muted-foreground">
          استدیو آرمان صدا را با Gemini TTS می‌سازد. برای این کار به یک کلید API
          از Google AI Studio نیاز داری. کلید روی دستگاه خودت ذخیره می‌شود و به
          سرورهای این برنامه فرستاده نمی‌شود مگر در همان درخواست تولید صدا.
        </p>
      </header>

      <ol className="space-y-6 text-pretty leading-8">
        <li className="rounded-2xl border border-border bg-card p-5">
          <p className="font-semibold">۱. ورود به Google AI Studio</p>
          <p className="mt-2 text-muted-foreground">
            به{" "}
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              صفحه کلیدهای API
            </a>{" "}
            برو و با حساب گوگل وارد شو.
          </p>
        </li>
        <li className="rounded-2xl border border-border bg-card p-5">
          <p className="font-semibold">۲. ساخت کلید</p>
          <p className="mt-2 text-muted-foreground">
            روی Create API key بزن. اگر پروژه‌ای نداری، گوگل یکی می‌سازد. کلید را
            کپی کن؛ معمولاً با{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm">
              AIza
            </code>{" "}
            شروع می‌شود.
          </p>
        </li>
        <li className="rounded-2xl border border-border bg-card p-5">
          <p className="font-semibold">۳. ثبت در استدیو آرمان</p>
          <p className="mt-2 text-muted-foreground">
            به استودیو برگرد، دکمه «کلید API» را بزن، کلید را در کادر بچسبان و
            ذخیره کن. اگر کلید درست باشد پیام موفقیت می‌بینی و دکمه به «تایید»
            عوض می‌شود. با زدن تایید پنجره بسته می‌شود.
          </p>
        </li>
        <li className="rounded-2xl border border-border bg-card p-5">
          <p className="font-semibold">۴. اگر خطا گرفتی</p>
          <p className="mt-2 text-muted-foreground">
            کلید خالی، کلید ناقص، یا کلید بدون دسترسی به مدل‌های TTS رایج‌ترین
            علت‌ها هستند. کلید را دوباره از AI Studio کپی کن و مطمئن شو مدل‌های
            Gemini برای آن پروژه فعال‌اند.
          </p>
        </li>
      </ol>
    </>
  );
}
