import type { ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "راهنما · استدیو آرمان",
};

export default function GuideLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
          >
            <ArrowRight className="size-4" />
            بازگشت به استودیو
          </Link>
          <p className="rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
            صفحه راهنما
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
