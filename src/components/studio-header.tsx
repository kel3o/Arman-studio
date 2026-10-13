"use client"

import { useEffect, useState, useSyncExternalStore } from "react"
import { BookOpen, CheckCircle2, KeyRound, Moon, Sun } from "lucide-react"

import { Link } from "@/components/app-link"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  getApiKeyServerSnapshot,
  getApiKeySnapshot,
  persistApiKey,
  subscribeApiKey,
  subscribeOpenApiDialog,
} from "@/lib/api-key-store"
import { useI18n, type Locale } from "@/lib/i18n"

export function StudioHeader() {
  const { t, locale, dir, setLocale, theme, toggleTheme } = useI18n()
  const apiKey = useSyncExternalStore(
    subscribeApiKey,
    getApiKeySnapshot,
    getApiKeyServerSnapshot,
  )
  const [draftKey, setDraftKey] = useState("")
  const [keyDialogOpen, setKeyDialogOpen] = useState(false)
  const [keyError, setKeyError] = useState("")
  const [keySuccess, setKeySuccess] = useState(false)
  const needsKey = !apiKey

  useEffect(() => {
    return subscribeOpenApiDialog(() => {
      setDraftKey(getApiKeySnapshot())
      setKeyError("")
      setKeySuccess(false)
      setKeyDialogOpen(true)
    })
  }, [])

  return (
    <>
      <div className="relative flex items-center justify-between gap-3">
        <div className="relative z-10 flex flex-wrap items-center gap-2">
          <Link
            href="/guide"
            className={buttonVariants({ variant: "outline", size: "lg" })}
          >
            <BookOpen data-icon="inline-start" />
            {t("header.guide")}
          </Link>
          <Button
            variant={needsKey ? "default" : "outline"}
            size="lg"
            onClick={() => {
              setDraftKey(apiKey)
              setKeyError("")
              setKeySuccess(false)
              setKeyDialogOpen(true)
            }}
          >
            <KeyRound data-icon="inline-start" />
            {apiKey ? t("header.apiManage") : t("header.api")}
          </Button>
        </div>

        <h1 className="pointer-events-none absolute inset-x-0 text-center font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {t("app.name")}
        </h1>
        <span
          aria-hidden
          className="invisible font-heading text-2xl font-semibold sm:text-3xl"
        >
          {t("app.name")}
        </span>

        <div className="relative z-10 flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="studio-language">
            {t("header.language")}
          </label>
          <select
            id="studio-language"
            dir="ltr"
            className="h-9 rounded-lg border border-border bg-background px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            value={locale}
            onChange={(event) => setLocale(event.target.value as Locale)}
          >
            <option value="fa">فارسی</option>
            <option value="en">English</option>
          </select>
          <Button
            variant="outline"
            size="icon-lg"
            onClick={toggleTheme}
            aria-label={
              theme === "dark" ? t("header.lightMode") : t("header.darkMode")
            }
            title={
              theme === "dark" ? t("header.lightMode") : t("header.darkMode")
            }
          >
            {theme === "dark" ? <Sun /> : <Moon />}
          </Button>
        </div>
      </div>

      <Dialog
        open={keyDialogOpen}
        onOpenChange={(open) => {
          setKeyDialogOpen(open)
          if (!open) {
            setKeyError("")
            setKeySuccess(false)
          }
        }}
      >
        <DialogContent className="sm:max-w-md" dir={dir}>
          <DialogHeader>
            <DialogTitle>{t("api.title")}</DialogTitle>
            <DialogDescription>
              {t("api.description")}{" "}
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-foreground underline underline-offset-4"
              >
                Google AI Studio
              </a>
              .{" "}
              <Link
                href="/privacy"
                className="text-foreground underline underline-offset-4"
              >
                {t("api.privacy")}
              </Link>
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="api-key">API key</Label>
            <Input
              id="api-key"
              type="text"
              dir="ltr"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              data-1p-ignore="true"
              data-lpignore="true"
              placeholder={t("api.placeholder")}
              value={draftKey}
              onChange={(event) => {
                setDraftKey(event.target.value)
                setKeyError("")
                setKeySuccess(false)
              }}
            />
          </div>
          {keyError ? (
            <p role="alert" className="text-sm text-destructive">
              {keyError}
            </p>
          ) : null}
          {keySuccess ? (
            <p
              role="status"
              className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-100"
            >
              <CheckCircle2 className="size-4 shrink-0" />
              {t("api.success")}
            </p>
          ) : null}
          <DialogFooter className="sm:justify-between">
            <Button
              variant="ghost"
              onClick={() => {
                persistApiKey("")
                setDraftKey("")
                setKeySuccess(false)
                setKeyError("")
              }}
            >
              {t("api.clear")}
            </Button>
            {keySuccess ? (
              <Button
                onClick={() => {
                  setKeyDialogOpen(false)
                  setKeyError("")
                  setKeySuccess(false)
                }}
              >
                {t("api.confirm")}
              </Button>
            ) : (
              <Button
                onClick={() => {
                  if (!draftKey.trim()) {
                    setKeyError(t("api.required"))
                    return
                  }
                  persistApiKey(draftKey)
                  setKeyError("")
                  setKeySuccess(true)
                }}
              >
                {t("api.save")}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
