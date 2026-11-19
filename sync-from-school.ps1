# Copy the shared CODE from ..\the-school into this instance (19 Nov 2026). Never touches the instance files:
# curriculum\*.json except wonders.json and news.json, CLAUDE.md, README.md, docs\SEQUENCE.md, docs\RUNBOOK.md,
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
foreach ($f in @("curriculum\wonders.json", "curriculum\news.json", "docs\ENGINEERING.md")) {
  if (Test-Path (Join-Path $src $f)) { Copy-Item (Join-Path $src $f) (Join-Path $PSScriptRoot $f) -Force }
}
Write-Host "Code synced from the-school. Instance files untouched. Now: .\push.ps1 'sync from the-school <what>'" -ForegroundColor Green
