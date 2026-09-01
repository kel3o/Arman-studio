import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { TagCopyButton } from "@/components/tag-copy-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TONE_TAGS, tagWithBrackets } from "@/lib/tone-tags";

export default function TagsGuidePage() {
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
          راهنمای برچسب‌های لحن
        </h1>
        <p className="max-w-none text-pretty leading-8 text-muted-foreground">
          مدل Gemini می‌تواند علاوه بر خواندن متن، احساسات و حالات صوتی را هم
          اجرا کند. کافی است عبارت انگلیسی را داخل کروشه بگذاری؛ مثلاً{" "}
          <code dir="ltr" className="rounded bg-muted px-1.5 py-0.5 font-mono">
            [whispers]
          </code>
          . این برچسب‌ها را وسط جمله فارسی بچسبان تا لحن همان لحظه عوض شود.
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
  );
}
