const SAMPLE_RATE = 24_000
const CHANNELS = 1
const BIT_DEPTH = 16

function writeAscii(view: DataView, offset: number, text: string) {
  for (let i = 0; i < text.length; i += 1) {
    view.setUint8(offset + i, text.charCodeAt(i))
  }
}

export function isWaveBuffer(data: Uint8Array): boolean {
  return (
    data.length >= 12 &&
    String.fromCharCode(data[0], data[1], data[2], data[3]) === "RIFF"
  )
}

export function pcmToWav(
  pcm: Uint8Array,
  sampleRate = SAMPLE_RATE,
  channels = CHANNELS,
  bitDepth = BIT_DEPTH,
): Uint8Array {
  const blockAlign = (channels * bitDepth) / 8
  const byteRate = sampleRate * blockAlign
  const header = new ArrayBuffer(44)
  const view = new DataView(header)

  writeAscii(view, 0, "RIFF")
  view.setUint32(4, 36 + pcm.length, true)
  writeAscii(view, 8, "WAVE")
  writeAscii(view, 12, "fmt ")
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, channels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, byteRate, true)
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, bitDepth, true)
  writeAscii(view, 36, "data")
  view.setUint32(40, pcm.length, true)

  const out = new Uint8Array(44 + pcm.length)
  out.set(new Uint8Array(header), 0)
  out.set(pcm, 44)
  return out
}

export function audioBytesToWav(data: Uint8Array, mimeType?: string): Uint8Array {
  if (isWaveBuffer(data) || mimeType?.toLowerCase().includes("wav")) {
    return data
  }
  return pcmToWav(data)
}

export function wavToBlob(data: Uint8Array): Blob {
  const copy = new Uint8Array(data.byteLength)
  copy.set(data)
  return new Blob([copy], { type: "audio/wav" })
}
