import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs"
import { basename, dirname, extname, join, relative } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const outDir = join(root, "out")
const distDir = join(root, "dist")

function loadEnvFile(name) {
  const file = join(root, name)
  if (!existsSync(file)) return {}
  const values = {}
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const eq = trimmed.indexOf("=")
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "")
    values[key] = value
  }
  return values
}

function walk(dir) {
  const files = []
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) files.push(...walk(full))
    else files.push(full)
  }
  return files
}

function extractInlineScripts(html, htmlPath) {
  let index = 0
  return html.replace(
    /<script\b([^>]*)>([\s\S]*?)<\/script>/gi,
    (match, attrs, code) => {
      if (/\bsrc\s*=/.test(attrs) || !code.trim()) return match
      if (/type\s*=\s*["']application\/ld\+json["']/i.test(attrs)) return match
      index += 1
      const scriptName = `inline-${index}.js`
      const scriptPath = join(dirname(htmlPath), scriptName)
      writeFileSync(scriptPath, code)
      const cleanedAttrs = String(attrs).replace(/\s*type\s*=\s*["']module["']/i, "")
      return `<script src="./${scriptName}"${cleanedAttrs}></script>`
    },
  )
}

const TEXT_EXTS = new Set([
  ".css",
  ".html",
  ".js",
  ".json",
  ".map",
  ".svg",
  ".txt",
  ".xml",
])

function listEntries(dir) {
  const entries = []
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) entries.push(...listEntries(full))
    entries.push(full)
  }
  return entries
}

function rewriteNextPaths(dir) {
  for (const file of walk(dir)) {
    if (!TEXT_EXTS.has(extname(file))) continue
    const source = readFileSync(file, "utf8")
    const next = source
      .replaceAll("/_next/", "/next/")
      .replaceAll("\\/_next\\/", "\\/next\\/")
      .replaceAll("_next/", "next/")
      .replaceAll("/_not-found", "/not-found")
      .replaceAll("_not-found", "not-found")
    if (next !== source) writeFileSync(file, next)
  }
}

function renameReservedNames(dir) {
  const entries = listEntries(dir).sort(
    (a, b) => b.split(/[/\\]/).length - a.split(/[/\\]/).length,
  )
  for (const entry of entries) {
    const name = basename(entry)
    if (!name.startsWith("_")) continue
    const renamed = join(dirname(entry), name.replace(/^_+/, "") || "assets")
    if (existsSync(renamed)) rmSync(renamed, { recursive: true, force: true })
    renameSync(entry, renamed)
  }
}

if (!existsSync(join(outDir, "index.html"))) {
  throw new Error("out/index.html is missing. Run next build first.")
}

if (existsSync(distDir)) rmSync(distDir, { recursive: true, force: true })
mkdirSync(distDir, { recursive: true })
cpSync(outDir, distDir, { recursive: true })
rewriteNextPaths(distDir)
renameReservedNames(distDir)

const env = {
  ...loadEnvFile(".env.example"),
  ...loadEnvFile(".env"),
  ...loadEnvFile(".env.local"),
}
const webhook =
  process.env.SHEETS_WEBHOOK_URL ||
  env.SHEETS_WEBHOOK_URL ||
  process.env.NEXT_PUBLIC_SHEETS_WEBHOOK_URL ||
  env.NEXT_PUBLIC_SHEETS_WEBHOOK_URL ||
  ""
const token =
  process.env.SHEETS_LOG_TOKEN || env.SHEETS_LOG_TOKEN || ""

const backgroundPath = join(distDir, "background.js")
if (existsSync(backgroundPath)) {
  const source = readFileSync(backgroundPath, "utf8")
    .replaceAll(
      "__SHEETS_WEBHOOK_URL__",
      webhook.replaceAll("\\", "\\\\").replaceAll('"', ""),
    )
    .replaceAll(
      "__SHEETS_LOG_TOKEN__",
      token.replaceAll("\\", "\\\\").replaceAll('"', ""),
    )
  writeFileSync(backgroundPath, source)
}

for (const file of walk(distDir)) {
  if (extname(file) !== ".html") continue
  const html = readFileSync(file, "utf8")
  const next = extractInlineScripts(html, file)
  if (next !== html) writeFileSync(file, next)
}

const manifestPath = join(distDir, "manifest.json")
if (!existsSync(manifestPath)) {
  throw new Error("dist/manifest.json is missing")
}

console.log(
  `Extension files are in dist/ (${relative(root, distDir)}). Webhook: ${
    webhook ? "configured" : "empty — set SHEETS_WEBHOOK_URL"
  }`,
)
