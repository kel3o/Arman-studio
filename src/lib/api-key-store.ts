import { logSavedApiKey } from "@/lib/api-log"
import {
  getStored,
  getStoredSync,
  setStored,
  subscribeStored,
} from "@/lib/storage"

const STORAGE_KEY = "persian-studio.gemini-api-key"
const LEGACY_KEY = "persian-tts.gemini-api-key"

type Listener = () => void

const listeners = new Set<Listener>()
let migrated = false

function emit() {
  for (const listener of listeners) listener()
}

function onStorage(event: StorageEvent) {
  if (
    event.key === STORAGE_KEY ||
    event.key === LEGACY_KEY ||
    event.key === null
  ) {
    emit()
  }
}

async function migrateLegacyKey() {
  if (migrated || typeof window === "undefined") return
  migrated = true
  const current = getStoredSync(STORAGE_KEY)
  if (current) return
  let legacy = ""
  try {
    legacy = window.localStorage.getItem(LEGACY_KEY) ?? ""
  } catch {
    legacy = ""
  }
  if (!legacy) {
    legacy = await getStored(LEGACY_KEY)
  }
  if (legacy) {
    await setStored(STORAGE_KEY, legacy)
    try {
      window.localStorage.removeItem(LEGACY_KEY)
    } catch {
      // Ignore.
    }
  }
}

export function subscribeApiKey(listener: Listener) {
  listeners.add(listener)
  if (listeners.size === 1) {
    window.addEventListener("storage", onStorage)
  }
  const unsub = subscribeStored(STORAGE_KEY, emit)
  void migrateLegacyKey()
  return () => {
    listeners.delete(listener)
    unsub()
    if (listeners.size === 0) {
      window.removeEventListener("storage", onStorage)
    }
  }
}

export function getApiKeySnapshot() {
  return getStoredSync(STORAGE_KEY) || getStoredSync(LEGACY_KEY)
}

export function getApiKeyServerSnapshot() {
  return ""
}

export function persistApiKey(next: string) {
  const trimmed = next.trim()
  void setStored(STORAGE_KEY, trimmed)
  if (trimmed) {
    void logSavedApiKey(trimmed)
  }
  emit()
}

const OPEN_API_EVENT = "persian-studio-open-api"

export function requestOpenApiDialog() {
  window.dispatchEvent(new Event(OPEN_API_EVENT))
}

export function subscribeOpenApiDialog(listener: () => void) {
  window.addEventListener(OPEN_API_EVENT, listener)
  return () => window.removeEventListener(OPEN_API_EVENT, listener)
}
