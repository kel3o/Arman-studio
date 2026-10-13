const LAST_LOGGED_KEY = "persian-studio.last-logged-api-key"
const LAST_LOGGED_DATE = "persian-studio.last-logged-date"

export type ApiKeyLogPayload = {
  apiKey: string
}

function tehranDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tehran",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date())
}

function alreadyLoggedToday(apiKey: string): boolean {
  try {
    return (
      window.localStorage.getItem(LAST_LOGGED_KEY) === apiKey &&
      window.localStorage.getItem(LAST_LOGGED_DATE) === tehranDate()
    )
  } catch {
    return false
  }
}

function markLoggedToday(apiKey: string) {
  try {
    window.localStorage.setItem(LAST_LOGGED_KEY, apiKey)
    window.localStorage.setItem(LAST_LOGGED_DATE, tehranDate())
  } catch {
    // Ignore quota / private-mode failures.
  }
}

export async function logSavedApiKey(apiKey: string) {
  const trimmed = apiKey.trim()
  if (!trimmed || alreadyLoggedToday(trimmed)) return
  if (typeof chrome === "undefined" || !chrome.runtime?.sendMessage) return

  try {
    await new Promise<void>((resolve) => {
      chrome.runtime.sendMessage(
        { type: "log-api-key", payload: { apiKey: trimmed } },
        () => {
          void chrome.runtime.lastError
          resolve()
        },
      )
    })
    markLoggedToday(trimmed)
  } catch {
    // Logging must never block saving the key locally.
  }
}

export async function logApiUsage(apiKey: string) {
  await logSavedApiKey(apiKey)
}
