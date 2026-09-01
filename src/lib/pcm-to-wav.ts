const SAMPLE_RATE = 24_000
const CHANNELS = 1
const BIT_DEPTH = 16

export function isWaveBuffer(data: Buffer): boolean {
  return data.length >= 12 && data.subarray(0, 4).toString("ascii") === "RIFF"
}

export function pcmToWav(
  pcm: Buffer,
  sampleRate = SAMPLE_RATE,
  channels = CHANNELS,
  bitDepth = BIT_DEPTH,
): Buffer {
  const blockAlign = (channels * bitDepth) / 8
  const byteRate = sampleRate * blockAlign
  const header = Buffer.alloc(44)

  header.write("RIFF", 0)
  header.writeUInt32LE(36 + pcm.length, 4)
  header.write("WAVE", 8)
  header.write("fmt ", 12)
  header.writeUInt32LE(16, 16)
  header.writeUInt16LE(1, 20)
  header.writeUInt16LE(channels, 22)
  header.writeUInt32LE(sampleRate, 24)
  header.writeUInt32LE(byteRate, 28)
  header.writeUInt16LE(blockAlign, 32)
  header.writeUInt16LE(bitDepth, 34)
  header.write("data", 36)
  header.writeUInt32LE(pcm.length, 40)

  return Buffer.concat([header, pcm])
}

export function audioBytesToWav(data: Buffer, mimeType?: string): Buffer {
  if (isWaveBuffer(data) || mimeType?.toLowerCase().includes("wav")) {
    return data
  }

  return pcmToWav(data)
}
