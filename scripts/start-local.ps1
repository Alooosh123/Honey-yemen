[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [ValidatePattern('^COM[0-9]+$')]
    [string]$SerialPort,

    [switch]$SkipDependencyInstall
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$backendDir = Join-Path $root 'backend'
$frontendDir = Join-Path $root 'frontend'

function Write-Step([string]$Message) {
    Write-Host ([Environment]::NewLine + '== ' + $Message + ' ==') -ForegroundColor Cyan
}

function New-RandomHex([int]$Bytes = 32) {
    $buffer = New-Object byte[] $Bytes
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    try {
        $rng.GetBytes($buffer)
        return ([System.BitConverter]::ToString($buffer)).Replace('-', '').ToLowerInvariant()
    }
    finally {
        $rng.Dispose()
    }
}

function Ensure-EnvFile([string]$Target, [string]$Template) {
    if (-not (Test-Path $Target)) {
        if (-not (Test-Path $Template)) {
            throw "Missing environment template: $Template"
        }
        Copy-Item $Template $Target
        Write-Host "Created $Target" -ForegroundColor Green
    }
}

function Set-EnvValue([string]$Path, [string]$Key, [string]$Value) {
    $content = Get-Content -Raw -LiteralPath $Path
    $pattern = "(?m)^" + [regex]::Escape($Key) + "=.*$"
    if ([regex]::IsMatch($content, $pattern)) {
        $content = [regex]::Replace($content, $pattern, ($Key + "=" + $Value))
    }
    else {
        $content += [Environment]::NewLine + $Key + "=" + $Value + [Environment]::NewLine
    }
    [System.IO.File]::WriteAllText($Path, $content, ([System.Text.UTF8Encoding]::new($false)))
}

Write-Step 'Checking local requirements'
foreach ($commandName in @('docker', 'node', 'npm', 'python')) {
    if (-not (Get-Command $commandName -ErrorAction SilentlyContinue)) {
        throw "Required command not found: $commandName"
    }
}
$serialPorts = [System.IO.Ports.SerialPort]::GetPortNames()
if ($serialPorts -notcontains $SerialPort) {
    $available = if ($serialPorts.Count -gt 0) { $serialPorts -join ', ' } else { 'none detected' }
    throw "Serial port $SerialPort was not detected. Available ports: $available. Check USB and CH340 driver."
}
docker info *> $null
if ($LASTEXITCODE -ne 0) {
    throw 'Docker Engine is not running. Open Docker Desktop and wait until the engine is ready.'
}

Write-Step 'Preparing private environment files'
$rootEnv = Join-Path $root '.env'
$backendEnv = Join-Path $backendDir '.env'
$frontendEnv = Join-Path $frontendDir '.env.local'

Ensure-EnvFile $rootEnv (Join-Path $root '.env.example')
Ensure-EnvFile $backendEnv (Join-Path $backendDir '.env.example')
Ensure-EnvFile $frontendEnv (Join-Path $frontendDir '.env.example')

$rootContent = Get-Content -Raw -LiteralPath $rootEnv
if ($rootContent -match 'CHANGE_THIS_TO_A_LONG_RANDOM_PASSWORD') {
    $rootContent = $rootContent.Replace('CHANGE_THIS_TO_A_LONG_RANDOM_PASSWORD', (New-RandomHex))
}
if ($rootContent -match 'CHANGE_THIS_TO_ANOTHER_LONG_RANDOM_PASSWORD') {
    $rootContent = $rootContent.Replace('CHANGE_THIS_TO_ANOTHER_LONG_RANDOM_PASSWORD', (New-RandomHex))
}
if ($rootContent -match 'CHANGE_THIS_TO_A_LONG_RANDOM_TOKEN') {
    $rootContent = $rootContent.Replace('CHANGE_THIS_TO_A_LONG_RANDOM_TOKEN', (New-RandomHex 48))
}
[System.IO.File]::WriteAllText($rootEnv, $rootContent, (New-Object System.Text.UTF8Encoding($false)))
Set-EnvValue $backendEnv 'HONEY_SERIAL_PORT' $SerialPort

Write-Step 'Installing dependencies'
if (-not $SkipDependencyInstall) {
    Push-Location $backendDir
    try { npm ci; if ($LASTEXITCODE -ne 0) { throw 'Backend npm ci failed.' } }
    finally { Pop-Location }

    Push-Location $frontendDir
    try { npm ci; if ($LASTEXITCODE -ne 0) { throw 'Frontend npm ci failed.' } }
    finally { Pop-Location }

    Push-Location $root
    try {
        python -m pip install -r (Join-Path $root 'hardware\requirements.txt')
        if ($LASTEXITCODE -ne 0) { throw 'Python serial dependencies installation failed.' }
    }
    finally { Pop-Location }
}
else {
    Write-Host 'Dependency installation skipped by request.' -ForegroundColor Yellow
}

Write-Step 'Starting PostgreSQL and InfluxDB containers'
Push-Location $root
try {
    docker compose up -d
    if ($LASTEXITCODE -ne 0) { throw 'docker compose up failed.' }

    foreach ($service in @('postgres', 'influxdb')) {
        $healthy = $false
        for ($attempt = 0; $attempt -lt 60; $attempt++) {
            $containerId = docker compose ps -q $service
            if ($containerId) {
                $health = docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' $containerId
                if ($health -eq 'healthy') {
                    $healthy = $true
                    break
                }
            }
            Start-Sleep -Seconds 2
        }
        if (-not $healthy) { throw "Container service did not become healthy: $service" }
        Write-Host "$service is healthy." -ForegroundColor Green
    }
}
finally {
    Pop-Location
}

Write-Step 'Starting backend and frontend'
$backendCommand = "Set-Location -LiteralPath '$backendDir'; npm run dev"
$frontendCommand = "Set-Location -LiteralPath '$frontendDir'; npm run dev"
Start-Process -FilePath 'powershell.exe' -ArgumentList @('-NoExit', '-Command', $backendCommand)
Start-Process -FilePath 'powershell.exe' -ArgumentList @('-NoExit', '-Command', $frontendCommand)

Write-Host ([Environment]::NewLine + 'Backend:  http://localhost:3001/health') -ForegroundColor Green
Write-Host 'Frontend: http://localhost:3000' -ForegroundColor Green
Write-Host ("Arduino:  " + $SerialPort + " at 9600 baud") -ForegroundColor Green
Write-Host 'Close Arduino Serial Monitor before starting a scan.' -ForegroundColor Yellow
Write-Host 'Honey authenticity classification, checkout, and merchant/admin writes remain disabled until validated science, authentication, database persistence and payment are implemented.' -ForegroundColor Yellow
