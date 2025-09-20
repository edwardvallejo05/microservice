# 🚀 Sistema de Microservicios con MariaDB y Docker

Un sistema completo de microservicios con APIs REST para gestión de usuarios y pedidos, con operaciones CRUD (Create, Read, Update, Delete) conectado a una base de datos MariaDB y ejecutándose con Docker Compose.

## 📋 Características

### 🏗️ Arquitectura de Microservicios
- **Servicio de Usuarios** (Puerto 5001): Gestión completa de usuarios
- **Servicio de Pedidos** (Puerto 5002): Gestión completa de pedidos
- **Base de Datos MariaDB**: Sistema unificado con soporte UTF-8
- **Docker Compose**: Orquestación completa del sistema
- **Adminer**: Interfaz web para administrar la base de datos

### ✅ Características del Sistema
- ✅ **CRUD Completo**: Crear, leer, actualizar y eliminar usuarios y pedidos
- 🔍 **Búsqueda**: Buscar usuarios por nombre o email, pedidos por producto
- 💾 **Base de Datos**: MariaDB 11.2 con pool de conexiones
- 🛡️ **Validaciones**: Validación de datos y manejo de errores
- 🌐 **CORS**: Configurado para permitir peticiones entre servicios
- 📊 **Logging**: Manejo de errores y logs informativos
- ⚡ **Performance**: Pool de conexiones para mejor rendimiento
- 🐳 **Containerización**: Sistema completo con Docker Compose
- 🔗 **Integración**: Comunicación entre microservicios
- 🌍 **UTF-8**: Soporte completo para caracteres españoles (tildes, ñ)

## 🛠️ Requisitos Previos

- Docker Desktop instalado
- Docker Compose (incluido en Docker Desktop)
- 4GB de RAM disponible
- Puertos 5001, 5002, 3307 y 8080 libres

## � Instalación Rápida con Docker

### Opción 1: Ejecución Completa (Recomendada)

1. **Clonar o descargar el proyecto**

2. **Iniciar todo el sistema**
   ```bash
   docker-compose up --build -d
   ```

3. **Verificar que todo esté funcionando**
   ```bash
   # Verificar servicios
   curl http://localhost:5001/health  # Servicio de usuarios
   curl http://localhost:5002/health  # Servicio de pedidos
   
   # Verificar datos
   curl http://localhost:5001/usuarios
   curl http://localhost:5002/pedidos
   ```

4. **Acceder a la interfaz de administración**
   - Adminer: http://localhost:8080
   - Servidor: `mariadb`
   - Usuario: `app_user`
   - Contraseña: `root`
   - Base de datos: `usuarios_db`

### Opción 2: Instalación Local (Sin Docker)

Si prefieres ejecutar sin Docker:

1. **Instalar dependencias**
   ```bash
   npm install
   ```

2. **Configurar MariaDB**
   - Instalar MariaDB Server
   - Ejecutar el script SQL para crear la base de datos:
   ```bash
   mariadb -u root -p < docker/mysql-init/01-init.sql
   ```

3. **Configurar variables de entorno**
   - Edita el archivo `.env` con tus credenciales:
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=app_user
   DB_PASSWORD=root
   DB_NAME=usuarios_db
   USER_SERVICE_PORT=5001
   ORDER_SERVICE_PORT=5002
   USER_SERVICE_URL=http://localhost:5001
   ```

4. **Iniciar los servicios**
   ```bash
   # Terminal 1 - Servicio de usuarios
   node userService.js
   
   # Terminal 2 - Servicio de pedidos
   node orderService.js
   ```

## 🌐 Endpoints de la API

### 🏥 Servicios Disponibles

- **Servicio de Usuarios**: http://localhost:5001
- **Servicio de Pedidos**: http://localhost:5002
- **Administrador de BD**: http://localhost:8080

### 📊 Estado de los Servicios
- **GET** `http://localhost:5001/health` - Estado del servicio de usuarios
- **GET** `http://localhost:5002/health` - Estado del servicio de pedidos

## 👥 API del Servicio de Usuarios

### Base URL: `http://localhost:5001`

### 👥 Gestión de Usuarios

#### Obtener todos los usuarios
- **GET** `/usuarios`
- **Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nombre": "Ana García",
      "email": "ana.garcia@email.com",
      "telefono": "555-0001",
      "edad": 28,
      "fecha_creacion": "2024-01-01T10:00:00.000Z",
      "fecha_actualizacion": "2024-01-01T10:00:00.000Z"
    }
  ],
  "total": 1
}
```

#### Obtener usuario por ID
- **GET** `/usuarios/:id`
- **Respuesta:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "nombre": "Ana García",
    "email": "ana.garcia@email.com",
    "telefono": "555-0001",
    "edad": 28,
    "fecha_creacion": "2024-01-01T10:00:00.000Z",
    "fecha_actualizacion": "2024-01-01T10:00:00.000Z"
  }
}
```

#### Crear nuevo usuario
- **POST** `/usuarios`
- **Body (JSON):**
```json
{
  "nombre": "Juan Pérez",
  "email": "juan.perez@email.com",
  "telefono": "555-1234",
  "edad": 30
}
```
- **Campos requeridos:** `nombre`, `email`
- **Campos opcionales:** `telefono`, `edad`

#### Actualizar usuario
- **PUT** `/usuarios/:id`
- **Body (JSON):** (puedes enviar solo los campos que quieres actualizar)
```json
{
  "nombre": "Juan Carlos Pérez",
  "telefono": "555-5678"
}
```

#### Eliminar usuario
- **DELETE** `/usuarios/:id`

#### Buscar usuarios
- **GET** `/usuarios/buscar/:termino`
- Busca por nombre o email que contengan el término

## 🗂️ Estructura de la Base de Datos

### Base de Datos: `usuarios_db` (MariaDB 11.2)

### Tabla: `usuarios`
```sql
CREATE TABLE usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  telefono VARCHAR(20),
  edad INT,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Tabla: `pedidos`
```sql
CREATE TABLE pedidos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  producto VARCHAR(200) NOT NULL,
  descripcion TEXT,
  precio DECIMAL(10, 2) NOT NULL,
  cantidad INT NOT NULL DEFAULT 1,
  estado ENUM('pendiente', 'procesando', 'enviado', 'entregado', 'cancelado') DEFAULT 'pendiente',
  direccion_envio TEXT,
  fecha_pedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Credenciales de MariaDB
- **Host**: `mariadb` (en Docker) / `localhost:3307` (desde host)
- **Usuario**: `app_user`
- **Contraseña**: `root`
- **Base de datos**: `usuarios_db`
- **Root password**: `root`

## 📝 Ejemplos de Uso con cURL

### Servicio de Usuarios

#### Obtener todos los usuarios
```bash
curl http://localhost:5001/usuarios
```

#### Crear un usuario
```bash
curl -X POST http://localhost:5001/usuarios \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "María López",
    "email": "maria.lopez@email.com",
    "telefono": "555-9999",
    "edad": 25
  }'
```

#### Actualizar un usuario
```bash
curl -X PUT http://localhost:5001/usuarios/1 \
  -H "Content-Type: application/json" \
  -d '{
    "telefono": "555-0000"
  }'
```

#### Buscar usuarios
```bash
curl http://localhost:5001/usuarios/buscar/maria
```

### Servicio de Pedidos

#### Obtener todos los pedidos
```bash
curl http://localhost:5002/pedidos
```

#### Crear un pedido
```bash
curl -X POST http://localhost:5002/pedidos \
  -H "Content-Type: application/json" \
  -d '{
    "usuario_id": 1,
    "producto": "iPhone 15 Pro Max",
    "descripcion": "Smartphone premium de Apple",
    "precio": 1199.99,
    "cantidad": 1,
    "direccion_envio": "Calle 50 #25-30, Bogotá"
  }'
```

#### Actualizar estado de un pedido
```bash
curl -X PUT http://localhost:5002/pedidos/1 \
  -H "Content-Type: application/json" \
  -d '{
    "estado": "enviado"
  }'
```

#### Obtener pedidos de un usuario
```bash
curl http://localhost:5002/usuarios/1/pedidos
```

## 🛡️ Manejo de Errores

La API retorna respuestas consistentes con el siguiente formato:

### Éxito
```json
{
  "success": true,
  "data": { /* datos */ },
  "message": "Operación exitosa"
}
```

### Error
```json
{
  "success": false,
  "error": "Descripción del error",
  "details": "Detalles técnicos (opcional)"
}
```

### Códigos de Estado HTTP
- `200` - OK
- `201` - Creado
- `400` - Error en la petición
- `404` - No encontrado
- `409` - Conflicto (ej: email duplicado)
- `500` - Error interno del servidor

## 🔧 Desarrollo y Gestión

### Comandos Docker Útiles

```bash
# Iniciar todo el sistema
docker-compose up --build -d

# Ver logs en tiempo real
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f user-service
docker-compose logs -f order-service

# Reiniciar un servicio
docker-compose restart user-service

# Parar todo el sistema
docker-compose down

# Parar y eliminar volúmenes (reinicio completo)
docker-compose down -v
```

### Scripts disponibles
- `npm start` - Iniciar el servidor en producción
- `npm run dev` - Iniciar el servidor en modo desarrollo (con nodemon)

### Estructura del proyecto
```
├── userService.js          # Servicio de usuarios (Puerto 5001)
├── orderService.js         # Servicio de pedidos (Puerto 5002)
├── database.js             # Configuración de conexión a MariaDB
├── docker/
│   └── mysql-init/
│       └── 01-init.sql     # Script de inicialización de BD
├── Dockerfile              # Imagen Docker multi-stage
├── docker-compose.yml      # Orquestación de servicios
├── package.json            # Dependencias y scripts
├── .env.docker            # Variables de entorno Docker
├── README.md              # Documentación principal
├── README_DOCKER.md       # Guía de Docker
└── README_PEDIDOS.md      # Documentación de pedidos
```

## 🚨 Troubleshooting

### Error de conexión a MariaDB
1. Verifica que Docker esté ejecutándose
2. Revisa que los contenedores estén activos: `docker-compose ps`
3. Reinicia el sistema: `docker-compose down && docker-compose up --build -d`

### Puerto en uso
Si algún puerto está ocupado, cambia los puertos en `docker-compose.yml`:
```yaml
ports:
  - "5003:5001"  # Puerto externo 5003 -> interno 5001
```

### Servicios no se conectan entre sí
```bash
# Verificar la red
docker network ls
docker network inspect servicios_microservices_network

# Probar conectividad
docker-compose exec user-service ping mariadb
docker-compose exec order-service ping user-service
```

### Reinicio completo del sistema
```bash
# Eliminar todo y empezar de nuevo
docker-compose down -v
docker system prune -a
docker-compose up --build -d
```

### Error de dependencias (instalación local)
```bash
rm -rf node_modules package-lock.json
npm install
```

## 🔗 Comunicación entre Microservicios

El sistema implementa comunicación entre servicios:

1. **Validación de Usuarios**: El servicio de pedidos verifica que el usuario exista
2. **Datos Enriquecidos**: Los pedidos incluyen información del usuario
3. **Tolerancia a Fallos**: Los servicios continúan funcionando independientemente
4. **Health Checks**: Verificación automática del estado de los servicios

## 📊 Monitoreo

### Verificar estado del sistema:
```bash
# Estado de todos los servicios
curl http://localhost:5001/health
curl http://localhost:5002/health

# Ver logs
docker-compose logs -f

# Ver uso de recursos
docker stats
```

### Acceso a la base de datos:
- **Adminer**: http://localhost:8080
- **Conexión directa**: `docker-compose exec mariadb mariadb -u app_user -proot usuarios_db`

## ‍💻 Autor

Sistema de microservicios desarrollado para el curso de Lenguaje de Programación Avanzado 2 - Uniremington

### Tecnologías Utilizadas
- **Backend**: Node.js + Express
- **Base de Datos**: MariaDB 11.2
- **Containerización**: Docker + Docker Compose
- **Arquitectura**: Microservicios REST
- **Encoding**: UTF-8 (soporte completo para español)

¡Tu sistema de microservicios está listo para manejar usuarios y pedidos de forma completa! 🎉