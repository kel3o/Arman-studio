export const FINISH_DURATION_MS = 1_000
export const STALL_TIMEOUT_MS = 5 * 60 * 1_000

const BASE_SECONDS = 120
const EXTRA_SECONDS_PER_THOUSAND = 100

/** Loading time to reach 99%: 2 minutes for ≤1000 chars, plus 100s per extra 1000. */
export function loadingDurationMs(charCount: number): number {
  const chars = Math.max(0, charCount)
  if (chars <= 1_000) return BASE_SECONDS * 1_000
  const extraBlocks = Math.ceil((chars - 1_000) / 1_000)
  return (BASE_SECONDS + extraBlocks * EXTRA_SECONDS_PER_THOUSAND) * 1_000
}

export function progressRate(durationMs: number): number {
  const seconds = Math.max(1, durationMs / 1_000)
  return 99 / seconds
}

export function formatPercent(percent: number): string {
  const whole = Math.min(100, Math.max(0, Math.floor(percent)))
  return `${whole.toLocaleString("fa-IR")}٪`
}

export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "۰:۰۰"
  const whole = Math.floor(seconds)
  const minutes = Math.floor(whole / 60)
  const rest = whole % 60
  return `${minutes.toLocaleString("fa-IR")}:${rest
    .toString()
    .padStart(2, "0")
    .replace(/\d/g, (digit) => "۰۱۲۳۴۵۶۷۸۹"[Number(digit)])}`
}
