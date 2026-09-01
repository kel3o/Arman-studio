export type ChatRecord = {
  id: string
  title: string
  createdAt: number
  updatedAt: number
  text: string
  voice: string
  style: string
  hasAudio: boolean
  duration: number
  manualTitle: boolean
}

const DB_NAME = "farsi-khan-arman"
const DB_VERSION = 1
const ACTIVE_KEY = "persian-tts.active-chat-id"
const EMPTY_CHATS: ChatRecord[] = []

let chats: ChatRecord[] = EMPTY_CHATS
let activeChatId = ""
let loadStarted = false
const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) listener()
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains("chats")) {
        db.createObjectStore("chats", { keyPath: "id" })
      }
      if (!db.objectStoreNames.contains("audio")) {
        db.createObjectStore("audio")
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function idbRequest<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export function titleFromText(text: string): string {
  const line = text.trim().split(/\n+/)[0] ?? ""
  if (!line) return "چت جدید"
  return line.length > 40 ? `${line.slice(0, 40)}…` : line
}

function createBlankChat(): ChatRecord {
  const now = Date.now()
  return {
    id: crypto.randomUUID(),
    title: "چت جدید",
    createdAt: now,
    updatedAt: now,
    text: "",
    voice: "Kore",
    style: "natural",
    hasAudio: false,
    duration: 0,
    manualTitle: false,
  }
}

async function persistChat(chat: ChatRecord) {
  const db = await openDb()
  const tx = db.transaction("chats", "readwrite")
  await idbRequest(tx.objectStore("chats").put(chat))
}

async function hydrate() {
  if (typeof window === "undefined") return
  const db = await openDb()
  const tx = db.transaction("chats", "readonly")
  const rows = (await idbRequest(tx.objectStore("chats").getAll())) as ChatRecord[]
  chats = rows
    .map((row) => ({
      ...row,
      manualTitle: Boolean(row.manualTitle),
    }))
    .sort((a, b) => b.updatedAt - a.updatedAt)
  const stored = window.localStorage.getItem(ACTIVE_KEY)
  if (stored && chats.some((chat) => chat.id === stored)) {
    activeChatId = stored
  } else if (chats[0]) {
    activeChatId = chats[0].id
    window.localStorage.setItem(ACTIVE_KEY, activeChatId)
  }
  if (chats.length === 0) {
    const blank = createBlankChat()
    chats = [blank]
    activeChatId = blank.id
    window.localStorage.setItem(ACTIVE_KEY, blank.id)
    await persistChat(blank)
  }
  emit()
}

function ensureLoaded() {
  if (loadStarted || typeof window === "undefined") return
  loadStarted = true
  void hydrate()
}

export function subscribeChats(listener: () => void) {
  listeners.add(listener)
  ensureLoaded()
  return () => {
    listeners.delete(listener)
  }
}

export function getChatsSnapshot() {
  return chats
}

export function getChatsServerSnapshot() {
  return EMPTY_CHATS
}

export function getActiveChatIdSnapshot() {
  return activeChatId
}

export function getActiveChatIdServerSnapshot() {
  return ""
}

export async function createChat(): Promise<ChatRecord> {
  ensureLoaded()
  const chat = createBlankChat()
  chats = [chat, ...chats.filter((item) => item.id !== chat.id)]
  activeChatId = chat.id
  window.localStorage.setItem(ACTIVE_KEY, chat.id)
  emit()
  await persistChat(chat)
  return chat
}

export function selectChat(id: string) {
  if (!chats.some((chat) => chat.id === id)) return
  activeChatId = id
  window.localStorage.setItem(ACTIVE_KEY, id)
  emit()
}

export async function updateChat(
  id: string,
  patch: Partial<Omit<ChatRecord, "id" | "createdAt">>,
) {
  const current = chats.find((chat) => chat.id === id)
  if (!current) return
  const next: ChatRecord = {
    ...current,
    ...patch,
    updatedAt: Date.now(),
  }
  if (patch.text !== undefined && !next.manualTitle) {
    next.title = titleFromText(patch.text)
  }
  chats = [next, ...chats.filter((chat) => chat.id !== id)]
  emit()
  await persistChat(next)
}

export async function renameChat(id: string, title: string) {
  const trimmed = title.trim() || "چت جدید"
  await updateChat(id, { title: trimmed, manualTitle: true })
}

export async function saveChatAudio(id: string, blob: Blob, duration = 0) {
  const db = await openDb()
  const audioTx = db.transaction("audio", "readwrite")
  await idbRequest(audioTx.objectStore("audio").put(blob, id))
  await updateChat(id, { hasAudio: true, duration })
}

export async function loadChatAudio(id: string): Promise<Blob | null> {
  const db = await openDb()
  const tx = db.transaction("audio", "readonly")
  const blob = await idbRequest(tx.objectStore("audio").get(id))
  return blob instanceof Blob ? blob : null
}

export async function deleteChat(id: string) {
  const db = await openDb()
  const chatTx = db.transaction(["chats", "audio"], "readwrite")
  await idbRequest(chatTx.objectStore("chats").delete(id))
  await idbRequest(chatTx.objectStore("audio").delete(id))
  chats = chats.filter((chat) => chat.id !== id)
  if (activeChatId === id) {
    if (chats.length === 0) {
      const blank = createBlankChat()
      chats = [blank]
      activeChatId = blank.id
      await persistChat(blank)
    } else {
      activeChatId = chats[0].id
    }
    window.localStorage.setItem(ACTIVE_KEY, activeChatId)
  }
  emit()
}
