import { pcmFloatToWavBase64 } from "./lib/gemini.js"

let audioContext = null
let processor = null
let source = null
let stream = null
let originalGain = null
let collecting = []
let collectingFrames = 0
let targetFrames = 16000 * 4
let sending = false

chrome.runtime.onMessage.addListener((message) => {
  if (!message || typeof message !== "object") return
  if (message.type === "offscreen-start") {
    void startCapture(message.streamId, Number(message.originalVolume ?? 0.18))
  }
  if (message.type === "offscreen-stop") {
    stopCapture()
  }
  if (message.type === "offscreen-volume") {
    if (originalGain) {
      originalGain.gain.value = Number(message.value ?? 0.18)
    }
  }
})

async function startCapture(streamId, originalVolume) {
  stopCapture()
  stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      mandatory: {
        chromeMediaSource: "tab",
        chromeMediaSourceId: streamId,
      },
    },
  })
  audioContext = new AudioContext({ sampleRate: 16000 })
  source = audioContext.createMediaStreamSource(stream)
  originalGain = audioContext.createGain()
  originalGain.gain.value = Number.isFinite(originalVolume) ? originalVolume : 0.18
  processor = audioContext.createScriptProcessor(4096, 1, 1)
  processor.onaudioprocess = (event) => {
    const input = event.inputBuffer.getChannelData(0)
    collecting.push(new Float32Array(input))
    collectingFrames += input.length
    if (collectingFrames >= targetFrames && !sending) {
      void flushChunk()
    }
  }
  source.connect(originalGain)
  originalGain.connect(audioContext.destination)
  source.connect(processor)
  processor.connect(audioContext.destination)
}

async function flushChunk() {
  sending = true
  const frames = collectingFrames
  const merged = new Float32Array(frames)
  let offset = 0
  for (const part of collecting) {
    merged.set(part, offset)
    offset += part.length
  }
  collecting = []
  collectingFrames = 0
  const audioBase64 = pcmFloatToWavBase64(merged, audioContext?.sampleRate || 16000)
  try {
    await chrome.runtime.sendMessage({
      type: "live-audio-chunk",
      audioBase64,
      mimeType: "audio/wav",
    })
  } catch {
    // Background or tab may have closed.
  }
  sending = false
}

function stopCapture() {
  collecting = []
  collectingFrames = 0
  sending = false
  try {
    processor?.disconnect()
  } catch {
    // Ignore.
  }
  try {
    source?.disconnect()
  } catch {
    // Ignore.
  }
  try {
    originalGain?.disconnect()
  } catch {
    // Ignore.
  }
  processor = null
  source = null
  originalGain = null
  stream?.getTracks().forEach((track) => track.stop())
  stream = null
  if (audioContext) {
    void audioContext.close()
    audioContext = null
  }
}
