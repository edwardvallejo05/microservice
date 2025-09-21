@echo off
REM Script para construir el proyecto en Windows

echo 🚀 Iniciando construccion del sistema de microservicios...

echo.
echo 📋 Deteniendo contenedores existentes...
docker-compose down

echo.
echo 🔧 Limpiando cache de Docker...
docker system prune -f

echo.
echo 🏗️ Construyendo imagenes sin cache...
docker-compose build --no-cache

echo.
echo ⚡ Iniciando servicios...
docker-compose up -d

echo.
echo ⏳ Esperando que los servicios esten listos...
timeout /t 30 /nobreak > nul

echo.
echo 🩺 Verificando estado de los servicios...
curl -s http://localhost:5001/health
curl -s http://localhost:5002/health

echo.
echo ✅ Construccion completada!
echo.
echo 📊 URLs disponibles:
echo - Servicio de Usuarios: http://localhost:5001
echo - Servicio de Pedidos: http://localhost:5002  
echo - Administrador BD: http://localhost:8080
echo.
echo 📋 Para ver logs: docker-compose logs -f
echo 📋 Para detener: docker-compose down
pause