"use client";

import { useRef, useState } from "react";
import { Copy } from "lucide-react";

import { tagWithBrackets } from "@/lib/tone-tags";
import { cn } from "@/lib/utils";

export function TagCopyButton({ tagKey }: { tagKey: string }) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<number | null>(null);

  async function copy() {
    const value = tagWithBrackets(tagKey);
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = value;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <button
      type="button"
      onClick={() => void copy()}
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-md border border-transparent transition-colors",
        copied
          ? "text-emerald-600"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
      aria-label="کپی عبارت کلیدی"
      title="کپی عبارت کلیدی"
    >
      <Copy className="size-4" />
    </button>
  );
}
