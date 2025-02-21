# Construct 3 installer to transfer nw.js zip file to the Steam local folder

# Define paths
$downloadPath = "~/Downloads/greengrinds-txn.zip"
$steamPath = "C:\Program Files (x86)\Steam\steamapps\common\DungeonSds"
$expandPath = "~/Downloads/greengrinds-txn"

# Check if zip file exists
if (Test-Path $downloadPath) {
    # Create temporary directory and expand archive
    New-Item -ItemType Directory -Force -Path $expandPath
    Expand-Archive -Path $downloadPath -DestinationPath $expandPath -Force

    # Copy contents of win64 directory to Steam path
    Copy-Item -Path "$expandPath\win64\*" -Destination $steamPath -Recurse -Force

    # Clean up
    Remove-Item -Path $downloadPath -Force
    Remove-Item -Path $expandPath -Recurse -Force

    Write-Host "Installation completed successfully!"
} else {
    Write-Host "Error: $downloadPath not found in Downloads folder!"
}