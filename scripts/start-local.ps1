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
$utf8NoBom = [System.Text.UTF8Encoding]::new($false)

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

function Set-EnvValue([string]$FilePath, [string]$Key, [string]$Value) {
    $content = Get-Content -Raw -LiteralPath $FilePath
    $pattern = '(?m)^' + [regex]::Escape($Key) + '=.*$'
    if ([regex]::IsMatch($content, $pattern)) {
        $content = [regex]::Replace($content, $pattern, ($Key + '=' + $Value))
    }
    else {
        $content += [Environment]::NewLine + $Key + '=' + $Value + [Environment]::NewLine
    }
    [System.IO.File]::WriteAllText($FilePath, $content, $utf8NoBom)
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
$rootContent = $rootContent.Replace('CHANGE_THIS_TO_A_LONG_RANDOM_PASSWORD', (New-RandomHex))
$rootContent = $rootContent.Replace('CHANGE_THIS_TO_ANOTHER_LONG_RANDOM_PASSWORD', (New-RandomHex))
$rootContent = $rootContent.Replace('CHANGE_THIS_TO_A_LONG_RANDOM_TOKEN', (New-RandomHex 48))
[System.IO.File]::WriteAllText($rootEnv, $rootContent, $utf8NoBom)

# Read simple KEY=VALUE entries from the root Docker environment file.
$rootSettings = @{}
foreach ($entry in (Get-Content -LiteralPath $rootEnv)) {
    if ([string]::IsNullOrWhiteSpace($entry) -or $entry.TrimStart().StartsWith('#')) {
        continue
    }
    $separator = $entry.IndexOf('=')
    if ($separator -le 0) {
        continue
    }
    $key = $entry.Substring(0, $separator).Trim()
    $value = $entry.Substring($separator + 1).Trim()
    $rootSettings[$key] = $value
}

foreach ($requiredKey in @('POSTGRES_USER', 'POSTGRES_PASSWORD', 'POSTGRES_DB')) {
    if (-not $rootSettings.ContainsKey($requiredKey) -or [string]::IsNullOrWhiteSpace($rootSettings[$requiredKey])) {
        throw "Missing $requiredKey in root .env"
    }
}

$dbPassword = [System.Uri]::EscapeDataString($rootSettings['POSTGRES_PASSWORD'])
$databaseUrl = 'postgresql://' + $rootSettings['POSTGRES_USER'] + ':' + $dbPassword +
    '@localhost:5432/' + $rootSettings['POSTGRES_DB'] + '?schema=public'
Set-EnvValue $backendEnv 'HONEY_SERIAL_PORT' $SerialPort
Set-EnvValue $backendEnv 'DATABASE_URL' $databaseUrl

Write-Step 'Installing dependencies'
if (-not $SkipDependencyInstall) {
    Push-Location $backendDir
    try {
        npm ci
        if ($LASTEXITCODE -ne 0) { throw 'Backend npm ci failed.' }
    }
    finally {
        Pop-Location
    }

    Push-Location $frontendDir
    try {
        npm ci
        if ($LASTEXITCODE -ne 0) { throw 'Frontend npm ci failed.' }
    }
    finally {
        Pop-Location
    }

    Push-Location $root
    try {
        python -m pip install -r (Join-Path $root 'hardware\requirements.txt')
        if ($LASTEXITCODE -ne 0) { throw 'Python serial dependencies installation failed.' }
    }
    finally {
        Pop-Location
    }
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
        Write-Host ($service + ' is healthy.') -ForegroundColor Green
    }
}
finally {
    Pop-Location
}

Write-Step 'Generating Prisma client and applying database migrations'
Push-Location $backendDir
try {
    npm run prisma:generate
    if ($LASTEXITCODE -ne 0) { throw 'Prisma client generation failed.' }
    npm run prisma:migrate:deploy
    if ($LASTEXITCODE -ne 0) { throw 'PostgreSQL migrations failed.' }
}
finally {
    Pop-Location
}

Write-Step 'Starting backend and frontend'
$quote = [char]34
$backendCommand = 'Set-Location -LiteralPath ' + $quote + $backendDir + $quote + '; npm run dev'
$frontendCommand = 'Set-Location -LiteralPath ' + $quote + $frontendDir + $quote + '; npm run dev'
Start-Process -FilePath 'powershell.exe' -ArgumentList @('-NoExit', '-Command', $backendCommand)
Start-Process -FilePath 'powershell.exe' -ArgumentList @('-NoExit', '-Command', $frontendCommand)

Write-Host ([Environment]::NewLine + 'Backend:  http://localhost:3001/health') -ForegroundColor Green
Write-Host 'Readiness: http://localhost:3001/ready' -ForegroundColor Green
Write-Host 'Frontend: http://localhost:3000' -ForegroundColor Green
Write-Host ('Arduino:  ' + $SerialPort + ' at 9600 baud') -ForegroundColor Green
Write-Host 'Close Arduino Serial Monitor before starting a scan.' -ForegroundColor Yellow
Write-Host 'Honey authenticity classification, checkout, merchant/admin writes and remaining catalogue persistence are not production-enabled yet.' -ForegroundColor Yellow
