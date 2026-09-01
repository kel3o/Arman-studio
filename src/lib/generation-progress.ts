export const FINISH_DURATION_MS = 1_000
export const STALL_TIMEOUT_MS = 5 * 60 * 1_000

/** Percent per second for the 0–80% stretch. */
const BASE_PERCENT_PER_SECOND = 80 / 24

export function progressRate(percent: number): number {
  if (percent >= 99) return 0
  if (percent >= 90) return BASE_PERCENT_PER_SECOND * 0.4
  if (percent >= 80) return BASE_PERCENT_PER_SECOND * 0.7
  return BASE_PERCENT_PER_SECOND
}

export function formatPercent(percent: number): string {
  const whole = Math.min(100, Math.max(0, Math.floor(percent)))
  return `${whole.toLocaleString("fa-IR")}٪`
}
