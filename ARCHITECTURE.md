# 🏗️ Arquitectura del Sistema de Microservicios

## 📊 Diagrama de Arquitectura

```mermaid
graph TB
    %% Usuarios externos
    Client[👤 Cliente/Usuario]
    Admin[👨‍💻 Administrador]
    
    %% Load Balancer / Proxy (conceptual)
    subgraph "🌐 Interfaz Externa"
        LB[Puertos Expuestos<br/>5001, 5002, 8080, 3307]
    end
    
    %% Docker Network
    subgraph "🐳 Docker Network: microservices_network"
        
        %% Microservicios
        subgraph "⚡ Microservicios"
            US[🧑‍💼 User Service<br/>Node.js + Express<br/>Puerto: 5001<br/>Container: user_service]
            OS[📦 Order Service<br/>Node.js + Express<br/>Puerto: 5002<br/>Container: order_service]
        end
        
        %% Base de datos
        subgraph "💾 Capa de Datos"
            DB[(🗄️ MariaDB 11.2<br/>Puerto: 3306<br/>Container: microservices_mariadb<br/>DB: usuarios_db)]
        end
        
        %% Herramientas de administración
        subgraph "🛠️ Administración"
            ADM[📊 Adminer<br/>Web UI<br/>Puerto: 8080<br/>Container: microservices_adminer]
        end
        
    end
    
    %% Almacenamiento persistente
    subgraph "💿 Volúmenes Persistentes"
        VOL[📁 mariadb_data<br/>Datos de la BD]
        INIT[📄 docker/mysql-init<br/>Scripts de inicialización]
    end
    
    %% Conexiones principales
    Client -->|HTTP REST| LB
    Admin -->|Web Interface| LB
    
    LB -->|:5001| US
    LB -->|:5002| OS
    LB -->|:8080| ADM
    LB -->|:3307| DB
    
    %% Comunicación entre microservicios
    OS -->|HTTP/Axios<br/>GET /usuarios/:id| US
    
    %% Conexiones a base de datos
    US -->|MySQL2<br/>CRUD Usuarios| DB
    OS -->|MySQL2<br/>CRUD Pedidos| DB
    ADM -->|SQL Client| DB
    
    %% Volúmenes
    DB -.->|Persiste datos| VOL
    DB -.->|Inicialización| INIT
    
    %% Estilos
    classDef service fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef database fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef admin fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef external fill:#e8f5e8,stroke:#2e7d32,stroke-width:2px
    classDef storage fill:#fce4ec,stroke:#880e4f,stroke-width:2px
    
    class US,OS service
    class DB database
    class ADM admin
    class Client,Admin,LB external
    class VOL,INIT storage
```

## 🔄 Flujo de Datos

### 1. **Gestión de Usuarios**
```mermaid
sequenceDiagram
    participant C as Cliente
    participant US as User Service
    participant DB as MariaDB
    
    C->>US: GET /usuarios
    US->>DB: SELECT * FROM usuarios
    DB-->>US: Resultados
    US-->>C: JSON Response
    
    C->>US: POST /usuarios
    US->>DB: INSERT INTO usuarios
    DB-->>US: ID generado
    US-->>C: Usuario creado
```

### 2. **Gestión de Pedidos con Integración**
```mermaid
sequenceDiagram
    participant C as Cliente
    participant OS as Order Service
    participant US as User Service
    participant DB as MariaDB
    
    C->>OS: GET /pedidos
    OS->>DB: SELECT * FROM pedidos ORDER BY id ASC
    DB-->>OS: Lista de pedidos
    
    loop Para cada pedido
        OS->>US: GET /usuarios/{usuario_id}
        US->>DB: SELECT * FROM usuarios WHERE id = ?
        DB-->>US: Datos del usuario
        US-->>OS: Información del usuario
    end
    
    OS-->>C: Pedidos + Datos de usuarios
```

## 🏗️ Componentes del Sistema

### **Microservicios**

| Servicio | Puerto | Responsabilidades | Tecnologías |
|----------|--------|-------------------|-------------|
| **User Service** | 5001 | • CRUD de usuarios<br/>• Validaciones<br/>• API REST | Node.js, Express, MySQL2 |
| **Order Service** | 5002 | • CRUD de pedidos<br/>• Integración con usuarios<br/>• Enriquecimiento de datos | Node.js, Express, MySQL2, Axios |

### **Base de Datos**

| Componente | Puerto | Descripción | Configuración |
|------------|--------|-------------|---------------|
| **MariaDB** | 3306 (3307 externo) | • Almacenamiento principal<br/>• UTF-8 completo<br/>• Datos de ejemplo | Charset: utf8mb4<br/>Collation: utf8mb4_unicode_ci |

### **Herramientas**

| Herramienta | Puerto | Propósito | Acceso |
|-------------|--------|-----------|--------|
| **Adminer** | 8080 | Administración web de BD | http://localhost:8080 |

## 🔐 Seguridad y Configuración

### **Variables de Entorno**
```env
# Base de datos
DB_HOST=mariadb
DB_PORT=3306
DB_USER=app_user
DB_PASSWORD=root
DB_NAME=usuarios_db

# Servicios
USER_SERVICE_PORT=5001
ORDER_SERVICE_PORT=5002
USER_SERVICE_URL=http://user-service:5001
NODE_ENV=production
```

### **Health Checks**
- ✅ MariaDB: `mariadb-admin ping`
- ✅ User Service: `wget http://localhost:5001/health`
- ✅ Order Service: `wget http://localhost:5002/health`

## 📡 Endpoints API

### **User Service (Puerto 5001)**
```
GET    /usuarios        # Listar usuarios
GET    /usuarios/:id    # Obtener usuario
POST   /usuarios        # Crear usuario
PUT    /usuarios/:id    # Actualizar usuario
DELETE /usuarios/:id    # Eliminar usuario
GET    /health          # Health check
```

### **Order Service (Puerto 5002)**
```
GET    /pedidos         # Listar pedidos + datos de usuarios
GET    /pedidos/:id     # Obtener pedido + datos de usuario
POST   /pedidos         # Crear pedido
PUT    /pedidos/:id     # Actualizar pedido
DELETE /pedidos/:id     # Eliminar pedido
GET    /health          # Health check + integración
```

## 🛠️ Tecnologías Utilizadas

- **Runtime**: Node.js 18 Alpine
- **Framework**: Express.js
- **Base de Datos**: MariaDB 11.2
- **HTTP Client**: Axios
- **Contenedores**: Docker + Docker Compose
- **Administración**: Adminer
- **Arquitectura**: Microservicios RESTful

## 🚀 Despliegue

```bash
# Iniciar todo el sistema
docker-compose up --build -d

# Verificar servicios
docker-compose ps
curl http://localhost:5001/health
curl http://localhost:5002/health

# Acceder a Adminer
open http://localhost:8080
```

## 📈 Escalabilidad

Este diseño permite:
- ✅ Escalado horizontal de servicios
- ✅ Separación de responsabilidades
- ✅ Comunicación asíncrona
- ✅ Tolerancia a fallos
- ✅ Monitoreo independiente