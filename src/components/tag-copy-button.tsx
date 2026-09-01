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
    setCopied(true);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setCopied(false), 2000);

    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = value;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void copy()}
      data-copied={copied ? "true" : "false"}
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-md border transition-colors",
        copied
          ? "border-green-600 bg-green-100 text-green-700"
          : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
      style={copied ? { color: "#15803d" } : undefined}
      aria-label="کپی عبارت کلیدی"
      title="کپی عبارت کلیدی"
    >
      <Copy className="size-4" />
    </button>
  );
}
