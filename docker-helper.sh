#!/bin/bash
# Script de comandos rápidos para Docker Compose

case "$1" in
  "start")
    echo "🚀 Iniciando microservicios..."
    docker-compose up --build -d
    echo "✅ Servicios iniciados:"
    echo "   - Usuarios: http://localhost:5001"
    echo "   - Pedidos: http://localhost:5002"
    echo "   - Adminer: http://localhost:8080"
    ;;
  
  "stop")
    echo "🛑 Deteniendo servicios..."
    docker-compose stop
    echo "✅ Servicios detenidos"
    ;;
  
  "restart")
    echo "🔄 Reiniciando servicios..."
    docker-compose restart
    echo "✅ Servicios reiniciados"
    ;;
  
  "logs")
    echo "📋 Mostrando logs..."
    docker-compose logs -f
    ;;
  
  "status")
    echo "📊 Estado de los servicios:"
    docker-compose ps
    ;;
  
  "clean")
    echo "🧹 Limpiando contenedores y volúmenes..."
    docker-compose down -v
    docker system prune -f
    echo "✅ Limpieza completada"
    ;;
  
  "backup")
    DATE=$(date +%Y%m%d_%H%M%S)
    echo "💾 Creando backup de la base de datos..."
    docker-compose exec -T mysql mysqldump -u app_user -papp_password usuarios_db > "backup_$DATE.sql"
    echo "✅ Backup creado: backup_$DATE.sql"
    ;;
  
  "test")
    echo "🧪 Probando servicios..."
    echo "Test Usuarios:"
    curl -s http://localhost:5001/health | jq '.'
    echo -e "\nTest Pedidos:"
    curl -s http://localhost:5002/health | jq '.'
    ;;
  
  *)
    echo "🐳 Script de gestión de microservicios"
    echo ""
    echo "Uso: $0 {comando}"
    echo ""
    echo "Comandos disponibles:"
    echo "  start    - Iniciar todos los servicios"
    echo "  stop     - Detener todos los servicios"
    echo "  restart  - Reiniciar todos los servicios"
    echo "  logs     - Ver logs en tiempo real"
    echo "  status   - Ver estado de contenedores"
    echo "  clean    - Limpiar contenedores y volúmenes"
    echo "  backup   - Crear backup de la base de datos"
    echo "  test     - Probar que los servicios funcionen"
    echo ""
    echo "Ejemplos:"
    echo "  $0 start"
    echo "  $0 logs"
    echo "  $0 test"
    ;;
esac