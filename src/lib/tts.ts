import { STYLES, type StyleId } from "@/lib/voices"

export function buildSpeechPrompt(text: string, styleId: StyleId): string {
  const style = STYLES.find((item) => item.id === styleId) ?? STYLES[0]

  return [
    "Synthesize speech for the Persian (Farsi) transcript below.",
    "Use a native Iranian Persian accent as spoken in Tehran.",
    "Read the transcript exactly as written. Do not translate it.",
    "Do not read these instructions, labels, or director notes aloud.",
    "",
    "### DIRECTOR'S NOTES",
    "Accent: Standard Iranian Persian (Farsi), Tehran",
    `Style: ${style.notes}`,
    `Pacing: ${style.pacing}`,
    "",
    "#### TRANSCRIPT",
    text.trim(),
  ].join("\n")
}
