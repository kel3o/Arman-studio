const PREFIX = "persian-studio."

type Listener = () => void

const memory = new Map<string, string>()
const listeners = new Map<string, Set<Listener>>()
let watchingChrome = false
let watchingWindow = false

function fullKey(key: string) {
  return key.startsWith("persian-") ? key : PREFIX + key
}

function emit(key: string) {
  const set = listeners.get(key)
  if (!set) return
  for (const listener of set) listener()
}

function ensureWatchers() {
  if (typeof window === "undefined") return
  if (!watchingWindow) {
    watchingWindow = true
    window.addEventListener("storage", (event) => {
      if (!event.key) {
        for (const key of listeners.keys()) emit(key)
        return
      }
      emit(event.key)
    })
  }
  if (
    !watchingChrome &&
    typeof chrome !== "undefined" &&
    chrome.storage?.onChanged
  ) {
    watchingChrome = true
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== "local") return
      for (const key of Object.keys(changes)) emit(key)
    })
  }
}

export function getStoredSync(key: string, fallback = "") {
  const id = fullKey(key)
  if (memory.has(id)) return memory.get(id) ?? fallback
  if (typeof window === "undefined") return fallback
  try {
    const value = window.localStorage.getItem(id)
    if (value != null) {
      memory.set(id, value)
      return value
    }
  } catch {
    // Ignore private-mode failures.
  }
  return fallback
}

export async function getStored(key: string, fallback = "") {
  const id = fullKey(key)
  try {
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      const result = await chrome.storage.local.get(id)
      const value = result[id]
      if (typeof value === "string") {
        memory.set(id, value)
        try {
          window.localStorage.setItem(id, value)
        } catch {
          // Ignore quota.
        }
        return value
      }
    }
  } catch {
    // Fall through to localStorage.
  }
  return getStoredSync(id, fallback)
}

export async function setStored(key: string, value: string) {
  const id = fullKey(key)
  memory.set(id, value)
  try {
    if (value) window.localStorage.setItem(id, value)
    else window.localStorage.removeItem(id)
  } catch {
    // Ignore quota / private-mode failures.
  }
  try {
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      if (value) await chrome.storage.local.set({ [id]: value })
      else await chrome.storage.local.remove(id)
    }
  } catch {
    // Studio still works from localStorage.
  }
  emit(id)
}

export function subscribeStored(key: string, listener: Listener) {
  const id = fullKey(key)
  ensureWatchers()
  let set = listeners.get(id)
  if (!set) {
    set = new Set()
    listeners.set(id, set)
  }
  set.add(listener)
  return () => {
    set?.delete(listener)
  }
}

export { PREFIX as STORAGE_PREFIX }
