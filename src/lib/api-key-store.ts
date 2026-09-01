const STORAGE_KEY = "persian-tts.gemini-api-key"

type Listener = () => void

const listeners = new Set<Listener>()

function emit() {
  for (const listener of listeners) listener()
}

function onStorage(event: StorageEvent) {
  if (event.key === STORAGE_KEY || event.key === null) emit()
}

export function subscribeApiKey(listener: Listener) {
  listeners.add(listener)
  if (listeners.size === 1) {
    window.addEventListener("storage", onStorage)
  }
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) {
      window.removeEventListener("storage", onStorage)
    }
  }
}

export function getApiKeySnapshot() {
  return window.localStorage.getItem(STORAGE_KEY) ?? ""
}

export function getApiKeyServerSnapshot() {
  return ""
}

export function persistApiKey(next: string) {
  const trimmed = next.trim()
  if (trimmed) {
    window.localStorage.setItem(STORAGE_KEY, trimmed)
  } else {
    window.localStorage.removeItem(STORAGE_KEY)
  }
  emit()
}
