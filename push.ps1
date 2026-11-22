# Push cognipace-abid (19 Nov 2026). Same gates as the-school's push.ps1, without the "is she working" check -
# Abid is the only user and the one pressing the button.
#   cd C:\Users\ASUS\Projects\cognipace-abid
#   .\push.ps1 "what changed"
# Windows PowerShell 5.1: no && chains, no ternaries, no ?. operators.
param([Parameter(Mandatory=$true)][string]$Message)
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
$site = "https://cognipace-abid.vercel.app"

$nmLock = "node_modules\.package-lock.json"
if (-not (Test-Path $nmLock) -or ((Get-Item $nmLock).LastWriteTime -lt (Get-Item "package-lock.json").LastWriteTime)) {
  Write-Host "The package list changed - running npm install (once)..." -ForegroundColor Yellow
  $ErrorActionPreference = "Continue"
  npm install --no-audit --no-fund
  $npmExit = $LASTEXITCODE
  $ErrorActionPreference = "Stop"
  if ($npmExit -ne 0) { Write-Host "npm install failed (see above). Not committing." -ForegroundColor Red; exit 1 }
}

$ErrorActionPreference = "Continue"
npm run --silent lint:audit
$lint = $LASTEXITCODE
node scripts/test-codelines.mjs
$lines = $LASTEXITCODE
node scripts/test-curriculum.mjs
$curr = $LASTEXITCODE
node scripts/test-shortcuts.mjs
$keys = $LASTEXITCODE
$server = 0
if (Test-Path "scripts/test-server.mjs") { node scripts/test-server.mjs; $server = $LASTEXITCODE }
$ErrorActionPreference = "Stop"
if ($lint -ne 0) { Write-Host "Lint found an error (see above). Not committing." -ForegroundColor Red; exit 1 }
if ($lines -ne 0) { Write-Host "The Python line test failed (see above). Not committing." -ForegroundColor Red; exit 1 }
if ($curr -ne 0) { Write-Host "The curriculum structure test failed (see above). Not committing." -ForegroundColor Red; exit 1 }
if ($keys -ne 0) { Write-Host "The key-move test failed (see above). Not committing." -ForegroundColor Red; exit 1 }
if ($server -ne 0) { Write-Host "The server test failed (see above). Not committing." -ForegroundColor Red; exit 1 }

Write-Host "Building (the same build Vercel runs)..." -ForegroundColor Cyan
$ErrorActionPreference = "Continue"
npx next build
$build = $LASTEXITCODE
$ErrorActionPreference = "Stop"
if ($build -ne 0) { Write-Host "The build failed (see above). Not committing." -ForegroundColor Red; exit 1 }

Remove-Item .git\index.lock -ErrorAction SilentlyContinue
$ErrorActionPreference = "Continue"
git add -A
git commit -m $Message
if ($LASTEXITCODE -ne 0) { Write-Host "Nothing to commit." -ForegroundColor Yellow }
git push origin main
if ($LASTEXITCODE -ne 0) { $ErrorActionPreference = "Stop"; throw "push failed" }
$sha = (git rev-parse HEAD | Out-String).Trim()
$ErrorActionPreference = "Stop"
$short = $sha.Substring(0, 12)
Write-Host "PUSHED OK ($short)." -ForegroundColor Green
if (-not $site) { Write-Host "No site URL set in push.ps1 yet - skipping the live check. Fill in `$site after the first deploy." -ForegroundColor Yellow; exit 0 }

Write-Host "Waiting for Vercel to put $short live (every 15 s, up to 5 min)..." -ForegroundColor Green
$liveSha = ""
$deadline = (Get-Date).AddMinutes(5)
while ((Get-Date) -lt $deadline) {
  Start-Sleep -Seconds 15
  try { $ping = Invoke-RestMethod "$site/api/ping" -TimeoutSec 15 } catch { $ping = $null }
  if ($ping -and $ping.commit) { $liveSha = [string]$ping.commit } else { $liveSha = "" }
  if ($liveSha -and $sha.StartsWith($liveSha)) { break }
  Write-Host "  not yet..."
}
if (-not ($liveSha -and $sha.StartsWith($liveSha))) { Write-Host "Vercel did not deploy $short within 5 minutes - check the dashboard. The OLD version is still live." -ForegroundColor Red; exit 1 }
Write-Host "Live commit is $short. Checking every page..." -ForegroundColor Green
$ErrorActionPreference = "Continue"
node scripts/smoke.mjs $site $sha
$smoke = $LASTEXITCODE
$ErrorActionPreference = "Stop"
if ($smoke -ne 0) { Write-Host "Something is wrong on the live site." -ForegroundColor Red; exit 1 }
Write-Host "All good." -ForegroundColor Green
