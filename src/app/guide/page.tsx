import Link from "next/link";
import { BookOpen, KeyRound, LayoutPanelTop, Tags } from "lucide-react";

const TOPICS = [
  {
    href: "/guide/api",
    title: "دریافت و اتصال API از Gemini",
    description:
      "چطور از Google AI Studio کلید بگیری و آن را در استدیو آرمان ثبت کنی.",
    icon: KeyRound,
  },
  {
    href: "/guide/app",
    title: "راهنمای استفاده برنامه",
    description:
      "توضیح مختصر تمام بخش‌های صفحه استودیو و کارکرد هر کدام.",
    icon: LayoutPanelTop,
  },
  {
    href: "/guide/tags",
    title: "راهنمای برچسب‌های لحن",
    description:
      "برچسب‌های انگلیسی داخل کروشه برای نجوا، فریاد، خنده و ده‌ها لحن دیگر.",
    icon: Tags,
  },
];

export default function GuideHubPage() {
  return (
    <>
      <header className="space-y-3">
        <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <BookOpen className="size-4" />
          استدیو آرمان
        </p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          راهنما
        </h1>
        <p className="max-w-none text-pretty leading-8 text-muted-foreground">
          موضوع مورد نظرت را انتخاب کن. هر بخش جداگانه نوشته شده تا سریع به
          همان چیزی برسی که لازم داری.
        </p>
      </header>

      <ol className="grid gap-4">
        {TOPICS.map((topic, index) => {
          const Icon = topic.icon;
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
          );
        })}
      </ol>
    </>
  );
}
