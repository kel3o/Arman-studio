"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import {
  FINISH_DURATION_MS,
  STALL_TIMEOUT_MS,
  progressRate,
} from "@/lib/generation-progress"

type Phase = "idle" | "running" | "finishing" | "done"

type Handlers = {
  durationMs: number
  onFinished: () => void
  onTimeout: () => void
}

export function useGenerationProgress() {
  const [percent, setPercent] = useState(0)
  const [phase, setPhase] = useState<Phase>("idle")
  const percentRef = useRef(0)
  const phaseRef = useRef<Phase>("idle")
  const durationMsRef = useRef(120_000)
  const reached99AtRef = useRef<number | null>(null)
  const finishFromRef = useRef(0)
  const finishStartedAtRef = useRef(0)
  const handlersRef = useRef<Handlers | null>(null)

  useEffect(() => {
    phaseRef.current = phase
  }, [phase])

  useEffect(() => {
    if (phase !== "running" && phase !== "finishing") return

    let frame = 0
    let last = performance.now()

    const tick = (now: number) => {
      const current = phaseRef.current

      if (current === "finishing") {
        const elapsed = now - finishStartedAtRef.current
        const t = Math.min(1, elapsed / FINISH_DURATION_MS)
        const next = finishFromRef.current + (100 - finishFromRef.current) * t
        percentRef.current = next
        setPercent(next)
        if (t >= 1) {
          setPhase("done")
          handlersRef.current?.onFinished()
          return
        }
      } else if (current === "running") {
        const dt = Math.min(0.05, (now - last) / 1000)
        last = now
        let next =
          percentRef.current + progressRate(durationMsRef.current) * dt
        if (next >= 99) {
          next = 99
          if (reached99AtRef.current === null) {
            reached99AtRef.current = now
          } else if (now - reached99AtRef.current >= STALL_TIMEOUT_MS) {
            handlersRef.current?.onTimeout()
            return
          }
        }
        percentRef.current = next
        setPercent(next)
      } else {
        return
      }

      frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [phase])

  const start = useCallback((handlers: Handlers) => {
    handlersRef.current = handlers
    durationMsRef.current = Math.max(1_000, handlers.durationMs)
    percentRef.current = 0
    reached99AtRef.current = null
    setPercent(0)
    setPhase("running")
  }, [])

  const complete = useCallback(() => {
    if (phaseRef.current === "finishing" || phaseRef.current === "done") return
    finishFromRef.current = percentRef.current
    finishStartedAtRef.current = performance.now()
    setPhase("finishing")
  }, [])

  const reset = useCallback(() => {
    handlersRef.current = null
    percentRef.current = 0
    reached99AtRef.current = null
    setPercent(0)
    setPhase("idle")
  }, [])

  return { percent, phase, start, complete, reset }
}
