import { STYLES, type StyleId } from "@/lib/voices"

export function buildSpeechPrompt(
  text: string,
  styleId: StyleId,
  customNotes = "",
): string {
  const style = STYLES.find((item) => item.id === styleId) ?? STYLES[0]
  const trimmedCustom = customNotes.trim()
  const styleNotes =
    styleId === "custom" && trimmedCustom
      ? `${style.notes} Custom direction: ${trimmedCustom}`
      : style.notes

  return [
    "Synthesize speech for the Persian (Farsi) transcript below.",
    "Use a native Iranian Persian accent as spoken in Tehran.",
    "Read the transcript exactly as written. Do not translate it.",
    "Do not read these instructions, labels, or director notes aloud.",
    "",
    "### DIRECTOR'S NOTES",
    "Accent: Standard Iranian Persian (Farsi), Tehran",
    `Style: ${styleNotes}`,
    `Pacing: ${style.pacing}`,
    "",
    "#### TRANSCRIPT",
    text.trim(),
  ].join("\n")
}
