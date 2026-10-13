(() => {
  if (window.__persianStudioLoaded) return
  window.__persianStudioLoaded = true
  if (location.protocol === "chrome-extension:") return

  const I18N = {
    fa: {
      name: "Persian Studio",
      open: "باز کردن پنل",
      close: "بستن",
      subtitles: "زیرنویس فارسی",
      dubbing: "دوبله فارسی",
      stop: "توقف",
      loading: "در حال آماده‌سازی…",
      translating: "در حال ترجمه…",
      dubbingProgress: "در حال ساخت دوبله…",
      ready: "آماده است. ویدیو را پخش کنید.",
      noVideo: "ویدیویی در این صفحه پیدا نشد.",
      noKey: "اول کلید Gemini را در استودیو ذخیره کنید.",
      noCaptions: "زیرنویس پیدا نشد؛ از صدای زنده استفاده می‌شود.",
      error: "خطا",
    },
    en: {
      name: "Persian Studio",
      open: "Open panel",
      close: "Close",
      subtitles: "Persian subtitles",
      dubbing: "Persian dubbing",
      stop: "Stop",
      loading: "Preparing…",
      translating: "Translating…",
      dubbingProgress: "Building dub…",
      ready: "Ready. Play the video.",
      noVideo: "No video found on this page.",
      noKey: "Save a Gemini key in the studio first.",
      noCaptions: "No captions found; using live audio.",
      error: "Error",
    },
  }

  const state = {
    settings: {
      apiKey: "",
      locale: "fa",
      theme: "dark",
      voice: "Kore",
      originalVolume: 0.18,
      bilingual: false,
    },
    open: false,
    mode: null,
    status: "",
    error: "",
    progress: 0,
    cues: [],
    originalVolume: 1,
    raf: 0,
    abort: null,
    dubAudio: null,
    dubIndex: -1,
    live: false,
    host: null,
    shadow: null,
  }

  function t(key) {
    const pack = I18N[state.settings.locale] || I18N.fa
    return pack[key] || I18N.fa[key] || key
  }

  function send(message) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(message, (response) => {
        void chrome.runtime.lastError
        resolve(response)
      })
    })
  }

  async function loadSettings() {
    const settings = await send({ type: "get-settings" })
    if (settings && typeof settings === "object") {
      state.settings = { ...state.settings, ...settings }
    }
    render()
  }

  function isYouTube() {
    return /(^|\.)youtube\.com$|(^|\.)youtu\.be$|(^|\.)youtube-nocookie\.com$/.test(
      location.hostname,
    )
  }

  function findVideo() {
    return (
      document.querySelector("video.html5-main-video") ||
      document.querySelector("video.video-stream") ||
      document.querySelector("video")
    )
  }

  function videoBox() {
    const video = findVideo()
    if (!video) return null
    const rect = video.getBoundingClientRect()
    if (rect.width < 180 || rect.height < 80) return null
    return { video, rect }
  }

  function youtubePlayer() {
    return (
      document.getElementById("movie_player") ||
      document.querySelector(".html5-video-player")
    )
  }

  function captionTracksFromPlayer() {
    try {
      const player = youtubePlayer()
      const response =
        (player && typeof player.getPlayerResponse === "function"
          ? player.getPlayerResponse()
          : null) || window.ytInitialPlayerResponse
      return (
        response?.captions?.playerCaptionsTracklistRenderer?.captionTracks || []
      )
    } catch {
      return []
    }
  }

  function pickTrack(tracks) {
    if (!tracks.length) return null
    const fa = tracks.find((track) =>
      String(track.languageCode || "").startsWith("fa"),
    )
    const manual = tracks.find((track) => track.kind !== "asr")
    return fa || manual || tracks[0]
  }

  function parseJson3(data) {
    const cues = []
    for (const event of data.events || []) {
      if (!event.segs) continue
      const text = event.segs
        .map((seg) => seg.utf8 || "")
        .join("")
        .replace(/\n+/g, " ")
        .trim()
      if (!text) continue
      const startMs = Number(event.tStartMs || 0)
      const durationMs = Number(event.dDurationMs || 2000)
      cues.push({
        startMs,
        endMs: startMs + durationMs,
        text,
        source: text,
      })
    }
    return cues
  }

  async function fetchYoutubeCues() {
    const tracks = captionTracksFromPlayer()
    const track = pickTrack(tracks)
    if (!track?.baseUrl) return { cues: [], alreadyPersian: false, track: null }
    const url = new URL(track.baseUrl, location.origin)
    url.searchParams.set("fmt", "json3")
    const response = await fetch(url.toString())
    if (!response.ok) throw new Error("caption fetch failed")
    const data = await response.json()
    const cues = parseJson3(data)
    const alreadyPersian = String(track.languageCode || "").startsWith("fa")
    return { cues, alreadyPersian, track }
  }

  function html5Cues(video) {
    const cues = []
    for (const track of Array.from(video.textTracks || [])) {
      const list = track.cues
      if (!list?.length) continue
      for (let i = 0; i < list.length; i += 1) {
        const cue = list[i]
        const text = String(cue.text || "")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim()
        if (!text) continue
        cues.push({
          startMs: Math.round(cue.startTime * 1000),
          endMs: Math.round(cue.endTime * 1000),
          text,
          source: text,
        })
      }
      if (cues.length) break
    }
    return cues
  }

  function currentCue(video) {
    const timeMs = (video.currentTime || 0) * 1000
    return state.cues.find((cue) => timeMs >= cue.startMs && timeMs < cue.endMs)
  }

  function hideNativeCaptions(hide) {
    const id = "persian-studio-hide-captions"
    const existing = document.getElementById(id)
    if (!hide) {
      existing?.remove()
      return
    }
    if (existing) return
    const style = document.createElement("style")
    style.id = id
    style.textContent =
      ".ytp-caption-window-container,.caption-window{display:none!important}"
    document.documentElement.appendChild(style)
  }

  function restoreVolume() {
    const video = findVideo()
    if (video && Number.isFinite(state.originalVolume)) {
      video.volume = state.originalVolume
    }
  }

  function duckVolume() {
    const video = findVideo()
    if (!video) return
    state.originalVolume = video.volume
    const next = Number(state.settings.originalVolume)
    video.volume = Number.isFinite(next) ? Math.min(1, Math.max(0, next)) : 0.18
  }

  function stopDubAudio() {
    if (state.dubAudio) {
      state.dubAudio.pause()
      state.dubAudio.src = ""
      state.dubAudio = null
    }
    state.dubIndex = -1
  }

  async function stopAll() {
    state.mode = null
    state.live = false
    state.status = ""
    state.error = ""
    state.progress = 0
    state.cues = []
    hideNativeCaptions(false)
    restoreVolume()
    stopDubAudio()
    if (state.abort) state.abort.abort()
    state.abort = null
    await send({ type: "stop-tab-capture" })
    render()
  }

  function setStatus(status, extra = {}) {
    state.status = status
    Object.assign(state, extra)
    render()
  }

  async function translateIfNeeded(cues, alreadyPersian) {
    if (alreadyPersian) {
      return cues.map((cue) => ({ ...cue, text: cue.source }))
    }
    const response = await send({
      type: "translate-cues",
      cues: cues.map((cue, i) => ({ i, text: cue.source })),
    })
    if (!response?.ok) {
      throw new Error(response?.error || t("error"))
    }
    const map = new Map(
      (response.cues || []).map((row) => [row.i, row.text]),
    )
    return cues.map((cue, i) => ({
      ...cue,
      text: map.get(i) || cue.source,
    }))
  }

  async function startCaptions() {
    const box = videoBox()
    if (!box) {
      setStatus("", { error: t("noVideo") })
      return
    }
    if (!state.settings.apiKey) {
      setStatus("", { error: t("noKey") })
      return
    }
    await stopAll()
    state.mode = "subtitles"
    state.open = true
    setStatus(t("loading"), { error: "" })
    try {
      let cues = []
      let alreadyPersian = false
      if (isYouTube()) {
        const result = await fetchYoutubeCues()
        cues = result.cues
        alreadyPersian = result.alreadyPersian
      }
      if (!cues.length) cues = html5Cues(box.video)
      if (cues.length) {
        setStatus(t("translating"))
        state.cues = await translateIfNeeded(cues, alreadyPersian)
        hideNativeCaptions(true)
        setStatus(t("ready"), { progress: 1 })
      } else {
        state.live = true
        setStatus(t("noCaptions"))
        const capture = await send({ type: "start-tab-capture" })
        if (!capture?.ok) throw new Error(capture?.error || t("error"))
      }
    } catch (error) {
      state.mode = null
      setStatus("", { error: error instanceof Error ? error.message : t("error") })
    }
  }

  async function speakCue(cue) {
    if (cue.audioUrl) return cue.audioUrl
    const response = await send({
      type: "speak-text",
      text: cue.text,
      voice: state.settings.voice,
    })
    if (!response?.ok || !response.audioBase64) {
      throw new Error(response?.error || t("error"))
    }
    const binary = atob(response.audioBase64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
    cue.audioUrl = URL.createObjectURL(new Blob([bytes], { type: "audio/wav" }))
    return cue.audioUrl
  }

  async function startDubbing() {
    const box = videoBox()
    if (!box) {
      setStatus("", { error: t("noVideo") })
      return
    }
    if (!state.settings.apiKey) {
      setStatus("", { error: t("noKey") })
      return
    }
    await stopAll()
    state.mode = "dubbing"
    state.open = true
    setStatus(t("loading"), { error: "" })
    try {
      let cues = []
      let alreadyPersian = false
      if (isYouTube()) {
        const result = await fetchYoutubeCues()
        cues = result.cues
        alreadyPersian = result.alreadyPersian
      }
      if (!cues.length) cues = html5Cues(box.video)
      if (cues.length) {
        setStatus(t("translating"))
        state.cues = await translateIfNeeded(cues, alreadyPersian)
        hideNativeCaptions(true)
        duckVolume()
        setStatus(t("dubbingProgress"), { progress: 0.05 })
        const first = Math.min(6, state.cues.length)
        for (let i = 0; i < first; i += 1) {
          await speakCue(state.cues[i])
          setStatus(t("dubbingProgress"), { progress: (i + 1) / state.cues.length })
        }
        void prefetchRest()
        setStatus(t("ready"), { progress: 1 })
      } else {
        state.live = true
        duckVolume()
        setStatus(t("noCaptions"))
        const capture = await send({ type: "start-tab-capture" })
        if (!capture?.ok) throw new Error(capture?.error || t("error"))
      }
    } catch (error) {
      restoreVolume()
      state.mode = null
      setStatus("", { error: error instanceof Error ? error.message : t("error") })
    }
  }

  async function prefetchRest() {
    for (let i = 0; i < state.cues.length; i += 1) {
      if (state.mode !== "dubbing") return
      try {
        await speakCue(state.cues[i])
        state.progress = Math.max(state.progress, (i + 1) / state.cues.length)
        render()
      } catch {
        // Skip a failed cue and keep going.
      }
    }
  }

  function playCueAudio(cue, index, video) {
    if (state.dubIndex === index && state.dubAudio && !state.dubAudio.paused) return
    stopDubAudio()
    if (!cue.audioUrl) return
    const audio = new Audio(cue.audioUrl)
    state.dubAudio = audio
    state.dubIndex = index
    const cueSec = Math.max(0.2, (cue.endMs - cue.startMs) / 1000)
    if (audio.duration && Number.isFinite(audio.duration) && audio.duration > cueSec) {
      audio.playbackRate = Math.min(1.35, audio.duration / cueSec)
    }
    if (video.paused) return
    void audio.play().catch(() => {})
  }

  function tick() {
    const box = videoBox()
    placeUi(box)
    if (box && state.mode) {
      const cue = currentCue(box.video)
      updateCaption(box, cue)
      if (state.mode === "dubbing" && cue) {
        const index = state.cues.indexOf(cue)
        if (index >= 0) {
          if (!cue.audioUrl) void speakCue(cue)
          else playCueAudio(cue, index, box.video)
        }
      }
      if (state.mode === "dubbing" && box.video.paused) {
        state.dubAudio?.pause()
      }
    } else {
      updateCaption(null, null)
    }
    state.raf = requestAnimationFrame(tick)
  }

  function updateCaption(box, cue) {
    const node = state.shadow?.getElementById("ps-caption")
    if (!node) return
    if (!box || !cue || !state.mode) {
      node.hidden = true
      return
    }
    node.hidden = false
    node.style.left = `${box.rect.left + box.rect.width / 2}px`
    node.style.top = `${box.rect.bottom - Math.max(64, box.rect.height * 0.18)}px`
    node.querySelector(".ps-caption-fa").textContent = cue.text
    const src = node.querySelector(".ps-caption-src")
    src.hidden = !state.settings.bilingual
    src.textContent = cue.source || ""
  }

  function placeUi(box) {
    const chip = state.shadow?.getElementById("ps-chip")
    const panel = state.shadow?.getElementById("ps-panel")
    if (!chip || !panel) return
    const visible = Boolean(box) || state.mode
    chip.hidden = !visible || state.open
    panel.hidden = !visible || !state.open
    if (!box) return
    const left = Math.min(window.innerWidth - 296, box.rect.right - 292)
    const top = Math.max(12, box.rect.top + 12)
    const chipLeft = Math.min(window.innerWidth - 150, box.rect.right - 140)
    chip.style.left = `${Math.max(12, chipLeft)}px`
    chip.style.top = `${top}px`
    panel.style.left = `${Math.max(12, left)}px`
    panel.style.top = `${top}px`
  }

  function ensureUi() {
    if (state.host) return
    const host = document.createElement("div")
    host.id = "persian-studio-host"
    document.documentElement.appendChild(host)
    const shadow = host.attachShadow({ mode: "open" })
    state.host = host
    state.shadow = shadow
    const cssUrl = chrome.runtime.getURL("content/player.css")
    shadow.innerHTML = `
      <link rel="stylesheet" href="${cssUrl}" />
      <div class="ps-root" data-theme="dark">
        <button class="ps-chip" id="ps-chip" type="button" hidden></button>
        <section class="ps-panel" id="ps-panel" hidden>
          <div class="ps-head">
            <div class="ps-title">${I18N.fa.name}</div>
            <button class="ps-icon-btn" id="ps-close" type="button">×</button>
          </div>
          <div class="ps-body">
            <button class="ps-btn ps-btn-primary" id="ps-subtitles" type="button"></button>
            <button class="ps-btn ps-btn-primary" id="ps-dubbing" type="button"></button>
            <button class="ps-btn ps-btn-outline" id="ps-stop" type="button"></button>
            <div class="ps-progress" id="ps-progress" hidden><span></span></div>
            <div class="ps-status" id="ps-status"></div>
          </div>
        </section>
        <div class="ps-caption" id="ps-caption" hidden>
          <div class="ps-caption-fa"></div>
          <div class="ps-caption-src" hidden></div>
        </div>
      </div>
    `
    shadow.getElementById("ps-chip").addEventListener("click", () => {
      state.open = true
      render()
    })
    shadow.getElementById("ps-close").addEventListener("click", () => {
      state.open = false
      render()
    })
    shadow.getElementById("ps-subtitles").addEventListener("click", () => {
      void startCaptions()
    })
    shadow.getElementById("ps-dubbing").addEventListener("click", () => {
      void startDubbing()
    })
    shadow.getElementById("ps-stop").addEventListener("click", () => {
      void stopAll()
    })
  }

  function render() {
    ensureUi()
    const root = state.shadow.querySelector(".ps-root")
    root.dataset.theme = state.settings.theme
    root.dir = state.settings.locale === "en" ? "ltr" : "rtl"
    state.shadow.getElementById("ps-chip").textContent = t("name")
    state.shadow.querySelector(".ps-title").textContent = t("name")
    state.shadow.getElementById("ps-close").title = t("close")
    state.shadow.getElementById("ps-subtitles").textContent = t("subtitles")
    state.shadow.getElementById("ps-dubbing").textContent = t("dubbing")
    state.shadow.getElementById("ps-stop").textContent = t("stop")
    const busy = Boolean(state.mode)
    state.shadow.getElementById("ps-subtitles").disabled = busy
    state.shadow.getElementById("ps-dubbing").disabled = busy
    const status = state.shadow.getElementById("ps-status")
    status.textContent = state.error || state.status
    status.classList.toggle("ps-error", Boolean(state.error))
    const progress = state.shadow.getElementById("ps-progress")
    progress.hidden = !(state.progress > 0 && state.progress < 1)
    progress.querySelector("span").style.width = `${Math.round(state.progress * 100)}%`
  }

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return
    void loadSettings()
  })

  chrome.runtime.onMessage.addListener((message) => {
    if (!message || message.type !== "live-persian-text") return
    const text = String(message.text || "").trim()
    if (!text || !state.mode) return
    const video = findVideo()
    const startMs = Math.round((video?.currentTime || 0) * 1000)
    const cue = {
      startMs,
      endMs: startMs + 4000,
      text,
      source: text,
    }
    state.cues.push(cue)
    if (state.mode === "dubbing") {
      void speakCue(cue)
    }
  })

  document.addEventListener("yt-navigate-finish", () => {
    if (state.mode) void stopAll()
  })

  void loadSettings()
  ensureUi()
  state.raf = requestAnimationFrame(tick)
})()
