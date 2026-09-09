$ErrorActionPreference = "Stop"

if (-not $env:SUPABASE_PROJECT_ID) {
  throw "Define SUPABASE_PROJECT_ID antes de generar los tipos."
}

$outputPath = Join-Path $PSScriptRoot "..\src\types\database.generated.ts"
$generated = & npx.cmd supabase gen types typescript --project-id $env:SUPABASE_PROJECT_ID --schema public 2>&1
if ($LASTEXITCODE -ne 0) {
  throw ($generated -join [Environment]::NewLine)
}
$generated | Set-Content -Path $outputPath -Encoding utf8

Write-Output "Tipos generados en $outputPath"
