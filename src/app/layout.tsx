import type { Metadata } from "next"
import { Vazirmatn } from "next/font/google"

import { DirectionProvider } from "@/components/ui/direction"

import "./globals.css"

const vazirmatn = Vazirmatn({
  subsets: ["arabic", "latin"],
  variable: "--font-sans",
  display: "swap",
})

export const metadata: Metadata = {
  title: "استدیو آرمان",
  description:
    "متن فارسی را با Gemini text-to-speech به صدای طبیعی با لهجهٔ ایرانی تبدیل کنید.",
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fa"
      dir="rtl"
      className={`${vazirmatn.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body
        className="min-h-full bg-background font-sans text-foreground"
        suppressHydrationWarning
      >
        <DirectionProvider direction="rtl">{children}</DirectionProvider>
      </body>
    </html>
  )
}
