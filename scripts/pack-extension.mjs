import { spawnSync } from "node:child_process"
import { existsSync, readFileSync, rmSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const dist = join(root, "dist")
const zipPath = join(root, "persian-studio.zip")

if (!existsSync(join(dist, "manifest.json"))) {
  throw new Error("dist/manifest.json is missing. Run npm run build first.")
}

if (existsSync(zipPath)) rmSync(zipPath)

const result = spawnSync(
  "tar",
  ["-C", dist, "-a", "-cf", zipPath, "."],
  { stdio: "inherit" },
)

if (result.status !== 0) {
  throw new Error("Failed to create extension zip")
}

const bytes = readFileSync(zipPath).byteLength
console.log(`Packed ${zipPath} (${bytes} bytes)`)
