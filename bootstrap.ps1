# Stickman Animation Agent — Bootstrap Script
# Creates venv, installs dependencies, and sets up symlinks

$ErrorActionPreference = "Stop"
$ProjectRoot = $PSScriptRoot

Write-Host "=== Stickman Animation Agent Bootstrap ===" -ForegroundColor Cyan

# 1. Create Python venv
$venvPath = Join-Path $ProjectRoot ".venv"
if (-not (Test-Path $venvPath)) {
    Write-Host "Creating Python 3.12 venv..." -ForegroundColor Yellow
    py -3.12 -m venv $venvPath
} else {
    Write-Host "Venv already exists at $venvPath" -ForegroundColor Green
}

# 2. Install Python dependencies
$pip = Join-Path $venvPath "Scripts\pip.exe"
Write-Host "Installing Python dependencies..." -ForegroundColor Yellow
& $pip install -r (Join-Path $ProjectRoot "requirements.txt")

# 3. Install audio-toolkit if available
$audioToolkit = "C:\Dev\ai\audio-toolkit"
if (Test-Path $audioToolkit) {
    Write-Host "Installing audio-toolkit..." -ForegroundColor Yellow
    & $pip install -e $audioToolkit
}

# 4. Install npm dependencies
Write-Host "Installing npm dependencies..." -ForegroundColor Yellow
Set-Location $ProjectRoot
npm install

# 5. Create symlinks to shared scripts (requires admin)
$videoExplainerScripts = "C:\Dev\ai\video-explainer-agent\scripts"
$localScripts = Join-Path $ProjectRoot "scripts"

$symlinks = @{
    "kokoro_tts.py" = "kokoro_tts.py"
    "whisper_transcribe.py" = "whisper_transcribe.py"
    "audio_utils.py" = "audio_utils.py"
    "generate_subtitles.py" = "generate_subtitles.py"
}

$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

foreach ($link in $symlinks.GetEnumerator()) {
    $target = Join-Path $videoExplainerScripts $link.Value
    $linkPath = Join-Path $localScripts $link.Key

    if (Test-Path $linkPath) {
        Write-Host "  $($link.Key) already exists, skipping" -ForegroundColor Gray
        continue
    }

    if (-not (Test-Path $target)) {
        Write-Host "  WARNING: Source not found: $target" -ForegroundColor Red
        continue
    }

    if ($isAdmin) {
        New-Item -ItemType SymbolicLink -Path $linkPath -Target $target | Out-Null
        Write-Host "  Symlinked $($link.Key)" -ForegroundColor Green
    } else {
        Copy-Item $target $linkPath
        Write-Host "  Copied $($link.Key) (run as admin for symlinks)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "=== Bootstrap complete ===" -ForegroundColor Cyan
Write-Host "  Python venv: $venvPath"
Write-Host "  Activate:    .venv\Scripts\Activate.ps1"
Write-Host "  Run:         /stickman-animation"
