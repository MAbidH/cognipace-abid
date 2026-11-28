# Copy the shared CODE from ..\the-school into this instance (19 Nov 2026). Never touches the instance files:
# curriculum\*.json except wonders.json, news.json and reasoning.json (28 Nov: lib/puzzleBank.js imports it; child-only, a no-op here), CLAUDE.md, README.md, docs\SEQUENCE.md, docs\RUNBOOK.md,
# docs\HISTORY.md, push.ps1, this script, .env*, .git, node_modules, .next.
#   cd C:\Users\ASUS\Projects\cognipace-abid
#   .\sync-from-school.ps1
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
$src = Join-Path (Split-Path $PSScriptRoot -Parent) "the-school"
if (-not (Test-Path $src)) { throw "the-school not found next to this folder: $src" }
foreach ($d in @("app", "components", "lib", "scripts")) {
  robocopy (Join-Path $src $d) (Join-Path $PSScriptRoot $d) /MIR /NFL /NDL /NJH /NJS /NP | Out-Null
  if ($LASTEXITCODE -ge 8) { throw "robocopy failed on $d" }
}
foreach ($f in @("package.json", "package-lock.json", "next.config.js", "eslint.config.mjs", ".gitignore", ".env.example", "SECURITY.md", "SCHOOL_SPEC.md")) {
  if (Test-Path (Join-Path $src $f)) { Copy-Item (Join-Path $src $f) (Join-Path $PSScriptRoot $f) -Force }
}
foreach ($f in @("curriculum\wonders.json", "curriculum\news.json", "curriculum\reasoning.json", "docs\ENGINEERING.md")) {
  if (Test-Path (Join-Path $src $f)) { Copy-Item (Join-Path $src $f) (Join-Path $PSScriptRoot $f) -Force }
}
# 22 Nov 2026: the instance files are versioned in the-school\instances\abid too (Claude writes them there); re-apply
# that overlay here so this folder never drifts behind it. robocopy, not Copy-Item: Copy-Item -Recurse of a folder onto
# an existing folder nests it (curriculum\curriculum) - that is how the retired model id survived one "sync".
$overlay = Join-Path $src "instances\abid"
if (Test-Path $overlay) {
  robocopy $overlay $PSScriptRoot /E /NFL /NDL /NJH /NJS /NP | Out-Null
  if ($LASTEXITCODE -ge 8) { throw "robocopy (overlay) failed" }
}
foreach ($stray in @("curriculum\curriculum", "docs\docs")) { if (Test-Path $stray) { Remove-Item $stray -Recurse -Force } }
Write-Host "Code synced from the-school and the instance overlay re-applied. Now: .\push.ps1 'sync from the-school <what>'" -ForegroundColor Green
