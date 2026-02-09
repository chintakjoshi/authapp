$ErrorActionPreference = "Stop"

git config core.hooksPath .githooks

Write-Host "Git hooks path configured to .githooks"
Write-Host "pre-commit and pre-push checks are now active for this repository."
