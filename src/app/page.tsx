import { SpeechStudio } from "@/components/speech-studio"

export default function Home() {
  const hasServerKey = Boolean(process.env.GEMINI_API_KEY?.trim())
  return <SpeechStudio hasServerKey={hasServerKey} />
}
