"use client"

import { ArrowRight } from "lucide-react"

import { Link } from "@/components/app-link"
import { TagCopyButton } from "@/components/tag-copy-button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { TONE_TAGS, tagWithBrackets } from "@/lib/tone-tags"
import { useI18n } from "@/lib/i18n"

export function TagsGuidePage() {
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
          {t("guide.topic.tags.title")}
        </h1>
        <p className="max-w-none text-pretty leading-8 text-muted-foreground">
          {fa
            ? "مدل Gemini می‌تواند علاوه بر خواندن متن، احساسات و حالات صوتی را هم اجرا کند. کافی است عبارت انگلیسی را داخل کروشه بگذاری؛ مثلاً "
            : "Gemini can perform emotion and delivery as well as reading the words. Put an English tag in brackets, for example "}
          <code dir="ltr" className="rounded bg-muted px-1.5 py-0.5 font-mono">
            [whispers]
          </code>
          {fa
            ? ". این برچسب‌ها را وسط جمله فارسی بچسبان تا لحن همان لحظه عوض شود."
            : ". Place them inside the Persian sentence to change the delivery at that moment."}
        </p>
      </header>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-16 text-right">ردیف</TableHead>
              <TableHead className="text-right">اتفاق</TableHead>
              <TableHead className="text-right">احساس پشت آن</TableHead>
              <TableHead className="text-center">عبارت کلیدی</TableHead>
              <TableHead className="w-16 text-center">کپی</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {TONE_TAGS.map((tag, index) => (
              <TableRow
                key={tag.key}
                className={
                  index % 2 === 1
                    ? "bg-secondary hover:bg-secondary"
                    : "bg-card hover:bg-card"
                }
              >
                <TableCell className="text-muted-foreground">
                  {index + 1}
                </TableCell>
                <TableCell className="whitespace-normal font-medium">
                  {tag.event}
                </TableCell>
                <TableCell className="whitespace-normal">{tag.emotion}</TableCell>
                <TableCell dir="ltr">
                  <span className="block text-center font-mono text-sm">
                    {tagWithBrackets(tag.key)}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <TagCopyButton tagKey={tag.key} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  )
}
