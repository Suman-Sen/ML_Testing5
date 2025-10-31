# Set your project path
$projectPath = "D:\CODING ONLY\Sid\ML_Testing5\backend"

# Navigate to the project directory
Set-Location $projectPath

# Set the DATABASE_URL environment variable for this session
$env:DATABASE_URL = "postgresql://classify_user:classify_pass@localhost:5432/classify_db"

Write-Host " Working directory: $projectPath"
Write-Host " DATABASE_URL set for this session."

# Run Prisma generate
try {
    npx prisma generate
    Write-Host " Prisma Client generated successfully." -ForegroundColor Green
} catch {
    Write-Host " Failed to generate Prisma Client." -ForegroundColor Red
    Write-Host $_.Exception.Message
}
