"use client"

import type { ComponentProps } from "react"
import NextLink from "next/link"

type AppLinkProps = Omit<ComponentProps<typeof NextLink>, "href"> & {
  href?: string
  to?: string
}

export function Link({ href, to, ...props }: AppLinkProps) {
  return <NextLink href={to ?? href ?? "/"} {...props} />
}
