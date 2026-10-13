import type { ReactNode } from "react"
import { Vazirmatn } from "next/font/google"

import { AppProviders } from "@/components/app-providers"

import "./globals.css"

const vazirmatn = Vazirmatn({
  subsets: ["arabic", "latin"],
  variable: "--font-sans",
  display: "swap",
})

export const metadata = {
  title: "Persian Studio",
  description:
    "متن فارسی به گفتار، زیرنویس و دوبلهٔ ویدیو با Gemini — Persian text-to-speech, subtitles, and dubbing.",
}

const bootScript = `(function(){try{var t=localStorage.getItem("persian-studio.theme")||"dark";var l=localStorage.getItem("persian-studio.locale")||"fa";var d=document.documentElement;d.classList.toggle("dark",t!=="light");d.lang=l==="en"?"en":"fa";d.dir=l==="en"?"ltr":"rtl";d.style.colorScheme=t==="light"?"light":"dark";}catch(e){}})();`

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="fa"
      dir="rtl"
      className={`${vazirmatn.variable} dark h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      <body
        className="min-h-full bg-background font-sans text-foreground"
        suppressHydrationWarning
      >
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  )
}
