import { mkdirSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { spawnSync } from "node:child_process"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const iconsDir = join(root, "public", "icons")
mkdirSync(iconsDir, { recursive: true })

const ps1 = `
Add-Type -AssemblyName System.Drawing
function Save-Icon([int]$size, [string]$path) {
  $bmp = New-Object System.Drawing.Bitmap $size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.Clear([System.Drawing.Color]::Transparent)
  $bg = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 47, 122, 122))
  $white = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)
  $pad = [Math]::Max(1, [int]($size * 0.08))
  $g.FillEllipse($bg, $pad, $pad, $size - 2 * $pad, $size - 2 * $pad)
  $cx = $size / 2.0
  $cy = $size / 2.0
  $s = $size / 16.0
  $body = New-Object System.Drawing.Drawing2D.GraphicsPath
  $body.AddPolygon(@(
    (New-Object System.Drawing.PointF ($cx - 3.4*$s), ($cy - 1.4*$s)),
    (New-Object System.Drawing.PointF ($cx - 1.4*$s), ($cy - 1.4*$s)),
    (New-Object System.Drawing.PointF ($cx + 0.4*$s), ($cy - 3.1*$s)),
    (New-Object System.Drawing.PointF ($cx + 0.4*$s), ($cy + 3.1*$s)),
    (New-Object System.Drawing.PointF ($cx - 1.4*$s), ($cy + 1.4*$s)),
    (New-Object System.Drawing.PointF ($cx - 3.4*$s), ($cy + 1.4*$s))
  ))
  $g.FillPath($white, $body)
  $pen = New-Object System.Drawing.Pen ([System.Drawing.Color]::White), ([Math]::Max(1.0, $s * 0.55))
  $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  if ($size -ge 24) {
    $g.DrawArc($pen, $cx + 0.6*$s, $cy - 1.6*$s, 2.2*$s, 3.2*$s, -70, 140)
  }
  if ($size -ge 32) {
    $g.DrawArc($pen, $cx + 1.4*$s, $cy - 2.5*$s, 3.4*$s, 5.0*$s, -60, 120)
  }
  $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose()
  $bmp.Dispose()
}
Save-Icon 16 "${iconsDir.replace(/\\/g, "\\\\")}\\icon-16.png"
Save-Icon 32 "${iconsDir.replace(/\\/g, "\\\\")}\\icon-32.png"
Save-Icon 48 "${iconsDir.replace(/\\/g, "\\\\")}\\icon-48.png"
Save-Icon 128 "${iconsDir.replace(/\\/g, "\\\\")}\\icon-128.png"
`

const result = spawnSync("powershell.exe", ["-NoProfile", "-Command", ps1], {
  encoding: "utf8",
})
if (result.status !== 0) {
  console.error(result.stdout)
  console.error(result.stderr)
  throw new Error("Failed to generate icons")
}
console.log("Wrote icons to public/icons")
