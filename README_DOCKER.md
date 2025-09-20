# 🐳 Guía de Docker para Sistema de Microservicios

Esta guía te ayudará a ejecutar el sistema completo de microservicios usando Docker y Docker Compose con MariaDB.

## 📋 Prerequisitos

- Docker Desktop instalado
- Docker Compose (incluido en Docker Desktop)
- 4GB de RAM disponible
- Puertos 5001, 5002, 3307 y 8080 libres

## 🏗️ Arquitectura del Sistema

El sistema incluye estos contenedores:

1. **mariadb**: Base de datos MariaDB 11.2 (reemplaza MySQL)
2. **user-service**: Servicio de usuarios (Puerto 5001)
3. **order-service**: Servicio de pedidos (Puerto 5002)
4. **adminer**: Interfaz web para administrar MariaDB (Puerto 8080)

## 🚀 Instalación y Ejecución

### Opción 1: Ejecución Rápida

```bash
# Clonar/descargar el proyecto y navegar al directorio
cd Servicios

# Construir e iniciar todos los servicios
docker-compose up --build

# O en modo detached (en segundo plano)
docker-compose up --build -d
```

### Opción 2: Construcción Paso a Paso

```bash
# 1. Construir las imágenes
docker-compose build

# 2. Iniciar los servicios
docker-compose up

# 3. Verificar que todo esté funcionando
docker-compose ps
```

## 📊 Puertos y Acceso

Una vez iniciado, puedes acceder a:

- **Servicio de Usuarios**: http://localhost:5001
- **Servicio de Pedidos**: http://localhost:5002
- **Adminer (Admin MariaDB)**: http://localhost:8080
- **MariaDB**: localhost:3307 (desde el host)

### Credenciales de MariaDB (Unificadas)

- **Servidor**: `mariadb` (dentro de contenedores) o `localhost:3307` (desde host)
- **Usuario**: `app_user`
- **Contraseña**: `root` ⚠️ (Simplificada para desarrollo)
- **Base de datos**: `usuarios_db`
- **Root password**: `root`

### Credenciales para Adminer
- **Sistema**: MariaDB
- **Servidor**: `mariadb`
- **Usuario**: `app_user`
- **Contraseña**: `root`
- **Base de datos**: `usuarios_db`

## 🔍 Verificación de Servicios

### Comprobar estado de los servicios:
```bash
# Ver logs en tiempo real
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs user-service
docker-compose logs order-service

# Comprobar salud de los contenedores
docker-compose ps
```

### Probar los endpoints:

```bash
# Test servicio de usuarios
curl http://localhost:5001/health
curl http://localhost:5001/usuarios

# Test servicio de pedidos
curl http://localhost:5002/health
curl http://localhost:5002/pedidos
```

## 🛠️ Comandos Útiles de Docker Compose

### Gestión de Servicios

```bash
# Iniciar servicios
docker-compose up

# Iniciar en segundo plano
docker-compose up -d

# Parar servicios
docker-compose stop

# Parar y eliminar contenedores
docker-compose down

# Parar, eliminar contenedores y volúmenes
docker-compose down -v

# Reconstruir imágenes
docker-compose build --no-cache

# Reiniciar un servicio específico
docker-compose restart user-service
```

### Gestión de Datos

```bash
# Ver volúmenes
docker volume ls

# Eliminar volúmenes (¡Cuidado! Se pierden los datos)
docker volume prune

# Backup de la base de datos MariaDB
docker-compose exec mariadb mariadb-dump -u app_user -proot usuarios_db > backup.sql

# Restaurar base de datos
docker-compose exec -T mariadb mariadb -u app_user -proot usuarios_db < backup.sql

# Acceder directamente a MariaDB
docker-compose exec mariadb mariadb -u app_user -proot usuarios_db
```

### Debugging

```bash
# Acceder al contenedor de MariaDB
docker-compose exec mariadb mariadb -u app_user -proot usuarios_db

# Acceder al shell de un contenedor
docker-compose exec user-service sh
docker-compose exec order-service sh

# Ver variables de entorno de un contenedor
docker-compose exec user-service env | grep DB_
docker-compose exec order-service env | grep DB_

# Ver recursos utilizados
docker stats
```

## 🔧 Configuración Avanzada

### Variables de Entorno

Puedes modificar las variables en `docker-compose.yml` o crear un archivo `.env.local`:

```env
# .env.local
MARIADB_ROOT_PASSWORD=mi_password_seguro
MARIADB_PASSWORD=mi_app_password
USER_SERVICE_PORT=5001
ORDER_SERVICE_PORT=5002
```

⚠️ **Nota**: Actualmente el sistema usa credenciales simplificadas (`root`) para desarrollo.

### Escalamiento de Servicios

```bash
# Escalar el servicio de usuarios a 3 instancias
docker-compose up --scale user-service=3

# Nota: Necesitarías un load balancer para distribuir tráfico
```

### Desarrollo con Hot Reload

Para desarrollo, puedes montar el código como volumen:

```yaml
# En docker-compose.override.yml
version: '3.8'
services:
  user-service:
    volumes:
      - ./userService.js:/app/userService.js
      - ./database.js:/app/database.js
    environment:
      - NODE_ENV=development
    command: ["npx", "nodemon", "userService.js"]
```

## 📊 Monitoreo y Logs

### Ver logs en tiempo real:
```bash
# Todos los servicios
docker-compose logs -f

# Solo errores
docker-compose logs -f | grep ERROR

# Servicio específico
docker-compose logs -f user-service
```

### Métricas de rendimiento:
```bash
# Uso de recursos
docker stats

# Información detallada de contenedores
docker-compose ps -a
```

## 🚨 Troubleshooting

### Problema: Puerto en uso
```bash
# Ver qué proceso usa el puerto
lsof -i :5001
lsof -i :5002

# Cambiar puertos en docker-compose.yml
ports:
  - "5003:5001"  # Puerto externo 5003 -> interno 5001
```

### Problema: MariaDB no inicia
```bash
# Ver logs de MariaDB
docker-compose logs mariadb

# Problema común: Conflicto con MySQL local
# Solución: Cambiar puerto externo
ports:
  - "3308:3306"  # En lugar de 3307:3306

# Eliminar volúmenes y empezar de nuevo
docker-compose down -v
docker-compose up --build
```

### Problema: Servicios no se conectan
```bash
# Verificar la red
docker network ls
docker network inspect servicios_microservices_network

# Probar conectividad entre contenedores
docker-compose exec user-service ping mariadb
docker-compose exec order-service ping user-service

# Verificar variables de entorno
docker-compose exec order-service env | grep USER_SERVICE_URL
```

### Problema: Caracteres españoles no se muestran
✅ **Solucionado**: El sistema ya incluye configuración UTF-8:
- MariaDB configurado con `utf8mb4_unicode_ci`
- Tablas creadas con charset correcto
- Conexiones con encoding UTF-8

### Problema: Imágenes obsoletas
```bash
# Limpiar todo y reconstruir
docker-compose down -v
docker system prune -a
docker-compose build --no-cache
docker-compose up
```

## 🔄 Actualización y Mantenimiento

### Actualizar servicios:
```bash
# 1. Parar servicios
docker-compose stop

# 2. Actualizar código fuente

# 3. Reconstruir imágenes
docker-compose build

# 4. Reiniciar
docker-compose up -d
```

### Backup automático:
```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
docker-compose exec -T mariadb mariadb-dump -u app_user -proot usuarios_db > "backup_$DATE.sql"
echo "Backup creado: backup_$DATE.sql"
```

### Limpieza periódica:
```bash
# Limpiar imágenes no utilizadas
docker image prune -a

# Limpiar contenedores parados
docker container prune

# Limpiar volúmenes no utilizados
docker volume prune
```

## 📚 Estructura del Proyecto

```
Servicios/
├── docker/
│   └── mysql-init/
│       └── 01-init.sql          # Script inicialización MariaDB
├── userService.js               # Servicio de usuarios
├── orderService.js              # Servicio de pedidos
├── database.js                  # Configuración de BD
├── package.json                 # Dependencias Node.js
├── Dockerfile                   # Imagen Docker multi-stage
├── docker-compose.yml           # Orquestación de servicios
├── .dockerignore               # Archivos excluidos de Docker
├── .env.docker                 # Variables de entorno Docker
├── README.md                   # Documentación principal
├── README_DOCKER.md            # Esta documentación
└── README_PEDIDOS.md           # Documentación específica de pedidos
```

## 🌟 Características del Sistema

### ✅ Funcionalidades Implementadas
- **CRUD Completo**: Usuarios y pedidos
- **Integración**: Comunicación entre microservicios
- **Persistencia**: Datos almacenados en MariaDB
- **UTF-8**: Soporte completo para caracteres españoles
- **Health Checks**: Verificación automática de servicios
- **Docker**: Containerización completa
- **Admin Interface**: Adminer para gestión de BD

### 🚀 Ventajas de la Arquitectura
- **Escalabilidad**: Servicios independientes
- **Mantenibilidad**: Código modular y separado
- **Portabilidad**: Ejecuta en cualquier entorno Docker
- **Desarrollo**: Entorno completo con un comando
- **Monitoreo**: Logs y health checks integrados

## 🎯 Scripts Útiles

Puedes crear estos scripts en tu `package.json`:

```json
{
  "scripts": {
    "docker:build": "docker-compose build",
    "docker:up": "docker-compose up -d",
    "docker:down": "docker-compose down",
    "docker:logs": "docker-compose logs -f",
    "docker:clean": "docker-compose down -v && docker system prune -a",
    "docker:backup": "docker-compose exec -T mariadb mariadb-dump -u app_user -proot usuarios_db > backup_$(date +%Y%m%d).sql",
    "docker:restart": "docker-compose restart"
  }
}
```

Usar con:
```bash
npm run docker:up
npm run docker:logs
npm run docker:down
```

## 🚀 Deployment en Producción

Para producción, considera:

1. **Usar secretos** para passwords
2. **Configurar SSL/TLS** con reverse proxy (nginx)
3. **Implementar health checks** más robustos
4. **Usar registry privado** para imágenes
5. **Configurar logging** centralizado
6. **Implementar monitoring** (Prometheus, Grafana)

¡Tu sistema de microservicios está listo para ejecutarse en cualquier entorno con Docker! 🎉