# Pathar
$jsonPath = "models.json"
$modelsFolder = "models"

# Läs JSON
$models = Get-Content $jsonPath | ConvertFrom-Json

# Hämta alla GLB-filer (utan extension)
$glbFiles = Get-ChildItem $modelsFolder -Filter *.glb | Select-Object -ExpandProperty BaseName

# Lista över filnamn som finns i JSON
$jsonFiles = $models.file

# --- Ta bort poster som saknar GLB ---
$models = $models | Where-Object { $_.file -in $glbFiles }

# --- Hitta GLB som saknas i JSON ---
$missing = $glbFiles | Where-Object { $_ -notin $jsonFiles }

foreach ($file in $missing) {
    $newEntry = [PSCustomObject]@{
        title     = $file
        file      = $file
        "h-rotate" = "false"
    }
    $models += $newEntry
}

# Skriv tillbaka JSON snyggt formaterad
$models | ConvertTo-Json -Depth 10 | Set-Content $jsonPath

Write-Host "JSON synkad! Saknade modeller tillagda och överflödiga borttagna."
