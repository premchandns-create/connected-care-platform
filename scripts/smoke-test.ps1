<#
PowerShell smoke test for Connected Care Platform (demo)
Saves JSON responses to ./smoke/*.json and ./smoke/smoke-summary.json
#>
param(
    [string]$ApiBase = 'http://localhost:5080'
)

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$OutDir = Join-Path $ScriptDir '..\smoke' -Resolve
New-Item -ItemType Directory -Path $OutDir -Force | Out-Null

function Save-Json([string]$name, $obj){
    $path = Join-Path $OutDir ($name + '.json')
    $obj | ConvertTo-Json -Depth 12 | Out-File -FilePath $path -Encoding UTF8
    return $path
}

$now = (Get-Date).ToUniversalTime().ToString('u')
$results = @()

$endpoints = @{
    health = "$ApiBase/api/health";
    patients = "$ApiBase/api/patients";
    dashboard = "$ApiBase/api/dashboard";
    alerts = "$ApiBase/api/alerts";
}

foreach ($k in $endpoints.Keys) {
    $url = $endpoints[$k]
    try {
        Write-Host "GET $url"
        $r = Invoke-RestMethod -Uri $url -UseBasicParsing -ErrorAction Stop
        $file = Save-Json $k $r
        $results += [PSCustomObject]@{ name=$k; url=$url; status='OK'; file=$file }
    } catch {
        Write-Warning "Request failed: $url — $($_.Exception.Message)"
        $results += [PSCustomObject]@{ name=$k; url=$url; status='ERROR'; error=$_.Exception.Message }
    }
}

# AI endpoints (sample requests)
try {
    $body = @{ PatientId = 'P001' } | ConvertTo-Json
    Write-Host "POST $ApiBase/api/ai/patient-summary"
    $r = Invoke-RestMethod -Uri "$ApiBase/api/ai/patient-summary" -Method Post -Body $body -ContentType 'application/json' -ErrorAction Stop
    $file = Save-Json 'ai_patient_summary' $r
    $results += [PSCustomObject]@{ name='ai_patient_summary'; url='/api/ai/patient-summary'; status='OK'; file=$file }
} catch {
    Write-Warning "AI patient summary failed: $($_.Exception.Message)"
    $results += [PSCustomObject]@{ name='ai_patient_summary'; url='/api/ai/patient-summary'; status='ERROR'; error=$_.Exception.Message }
}

try {
    $body = @{ NurseName = 'Emma' } | ConvertTo-Json
    Write-Host "POST $ApiBase/api/ai/nurse-brief"
    $r = Invoke-RestMethod -Uri "$ApiBase/api/ai/nurse-brief" -Method Post -Body $body -ContentType 'application/json' -ErrorAction Stop
    $file = Save-Json 'ai_nurse_brief' $r
    $results += [PSCustomObject]@{ name='ai_nurse_brief'; url='/api/ai/nurse-brief'; status='OK'; file=$file }
} catch {
    Write-Warning "AI nurse brief failed: $($_.Exception.Message)"
    $results += [PSCustomObject]@{ name='ai_nurse_brief'; url='/api/ai/nurse-brief'; status='ERROR'; error=$_.Exception.Message }
}

try {
    Write-Host "POST $ApiBase/api/ai/management-brief"
    $r = Invoke-RestMethod -Uri "$ApiBase/api/ai/management-brief" -Method Post -ErrorAction Stop
    $file = Save-Json 'ai_management_brief' $r
    $results += [PSCustomObject]@{ name='ai_management_brief'; url='/api/ai/management-brief'; status='OK'; file=$file }
} catch {
    Write-Warning "AI management brief failed: $($_.Exception.Message)"
    $results += [PSCustomObject]@{ name='ai_management_brief'; url='/api/ai/management-brief'; status='ERROR'; error=$_.Exception.Message }
}

# Write summary
$summary = [PSCustomObject]@{ timestamp = $now; results = $results }
$summaryPath = Join-Path $OutDir 'smoke-summary.json'
$summary | ConvertTo-Json -Depth 6 | Out-File -FilePath $summaryPath -Encoding UTF8

Write-Host "Smoke test completed. Summary: $summaryPath"
Write-Host "Results:";
$results | Format-Table -AutoSize

# Exit with non-zero if any errors
if ($results | Where-Object { $_.status -ne 'OK' }) { exit 2 } else { exit 0 }