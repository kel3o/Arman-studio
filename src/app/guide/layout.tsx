import type { ReactNode } from "react"
import type { Metadata } from "next"

import { GuideLayout } from "@/views/guide-layout"

export const metadata: Metadata = {
  title: "راهنما · Persian Studio",
}

export default function Layout({ children }: { children: ReactNode }) {
  return <GuideLayout>{children}</GuideLayout>
}
