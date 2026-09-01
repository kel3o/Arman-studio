import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, BookOpen } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { TONE_TAGS } from "@/lib/tone-tags"

export const metadata: Metadata = {
  title: "صفحه راهنما · فارسی خوان مخصوص آرمان",
  description: "جدول برچسب‌های کنترل لحن برای Gemini TTS",
}

export default function GuidePage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:py-12">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-3xl space-y-3">
          <Badge variant="outline" className="border-primary/20 bg-accent/70">
            <BookOpen className="size-3" />
            صفحه راهنما
          </Badge>
          <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            راهنمای برچسب‌های لحن
          </h1>
          <p className="text-base leading-8 text-muted-foreground sm:text-lg">
            این برچسب‌ها را داخل متن فارسی بگذارید تا مدل بداند جمله را چطور
            بخواند. برچسب را انگلیسی و داخل کروشه بنویسید؛ مثلاً{" "}
            <code className="rounded-md bg-muted px-1.5 py-0.5 text-sm">
              [whispers]
            </code>
            . در جدول، عبارت کلیدی داخل {"{}"} آمده است. طبق مستندات Gemini،
            حتی برای متن فارسی هم برچسب را انگلیسی بگذارید.
          </p>
        </div>
        <Button variant="outline" size="lg" nativeButton={false} render={<Link href="/" />}>
          <ArrowRight data-icon="inline-start" />
          بازگشت به استودیو
        </Button>
      </header>

      <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-16 text-center">ردیف</TableHead>
              <TableHead>اتفاق</TableHead>
              <TableHead>احساس پشت آن</TableHead>
              <TableHead className="font-mono">عبارت کلیدی</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {TONE_TAGS.map((tag, index) => (
              <TableRow key={tag.key}>
                <TableCell className="text-center tabular-nums text-muted-foreground">
                  {(index + 1).toLocaleString("fa-IR")}
                </TableCell>
                <TableCell className="whitespace-normal leading-7">
                  {tag.event}
                </TableCell>
                <TableCell className="whitespace-normal leading-7">
                  {tag.feeling}
                </TableCell>
                <TableCell className="font-mono text-sm whitespace-nowrap" dir="ltr">
                  {tag.key}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
