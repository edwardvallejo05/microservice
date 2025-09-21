# Script PowerShell para construir el proyecto en Windows
Write-Host "🚀 Iniciando construcción del sistema de microservicios..." -ForegroundColor Green

Write-Host "`n📋 Deteniendo contenedores existentes..." -ForegroundColor Yellow
docker-compose down

Write-Host "`n🔧 Limpiando cache de Docker..." -ForegroundColor Yellow
docker system prune -f

Write-Host "`n🏗️ Construyendo imágenes sin cache..." -ForegroundColor Yellow
docker-compose build --no-cache

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error en la construcción. Revisar logs arriba." -ForegroundColor Red
    Read-Host "Presiona Enter para continuar"
    exit 1
}

Write-Host "`n⚡ Iniciando servicios..." -ForegroundColor Yellow
docker-compose up -d

Write-Host "`n⏳ Esperando que los servicios estén listos..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

Write-Host "`n🩺 Verificando estado de los servicios..." -ForegroundColor Yellow
try {
    $userHealth = Invoke-WebRequest -Uri "http://localhost:5001/health" -TimeoutSec 10
    Write-Host "✅ Servicio de Usuarios: OK" -ForegroundColor Green
} catch {
    Write-Host "❌ Servicio de Usuarios: Error" -ForegroundColor Red
}

try {
    $orderHealth = Invoke-WebRequest -Uri "http://localhost:5002/health" -TimeoutSec 10
    Write-Host "✅ Servicio de Pedidos: OK" -ForegroundColor Green
} catch {
    Write-Host "❌ Servicio de Pedidos: Error" -ForegroundColor Red
}

Write-Host "`n✅ Construcción completada!" -ForegroundColor Green
Write-Host "`n📊 URLs disponibles:" -ForegroundColor Cyan
Write-Host "- Servicio de Usuarios: http://localhost:5001" -ForegroundColor White
Write-Host "- Servicio de Pedidos: http://localhost:5002" -ForegroundColor White
Write-Host "- Administrador BD: http://localhost:8080" -ForegroundColor White
Write-Host "`n📋 Comandos útiles:" -ForegroundColor Cyan
Write-Host "- Ver logs: docker-compose logs -f" -ForegroundColor White
Write-Host "- Detener: docker-compose down" -ForegroundColor White

Read-Host "`nPresiona Enter para continuar"