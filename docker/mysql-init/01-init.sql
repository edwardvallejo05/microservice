-- Script de inicialización de MySQL para Docker
-- Este script se ejecuta automáticamente al crear el contenedor de MySQL

-- Configurar charset UTF-8
SET NAMES utf8mb4;
SET character_set_client = utf8mb4;

-- Usar la base de datos (ya está creada por las variables de entorno)
USE usuarios_db;

-- Crear la tabla de usuarios con charset UTF-8
CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  telefono VARCHAR(20),
  edad INT,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Crear la tabla de pedidos con charset UTF-8
CREATE TABLE IF NOT EXISTS pedidos (
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

-- Insertar usuarios de ejemplo
INSERT INTO usuarios (nombre, email, telefono, edad) VALUES 
('Ana García', 'ana.garcia@email.com', '555-0001', 28),
('Carlos López', 'carlos.lopez@email.com', '555-0002', 35),
('María Rodríguez', 'maria.rodriguez@email.com', '555-0003', 32),
('José Martínez', 'jose.martinez@email.com', '555-0004', 29),
('Laura Hernández', 'laura.hernandez@email.com', '555-0005', 26),
('Diego Pérez', 'diego.perez@email.com', '555-0006', 31),
('Carmen Sánchez', 'carmen.sanchez@email.com', '555-0007', 33),
('Roberto Gómez', 'roberto.gomez@email.com', '555-0008', 27),
('Elena Ruiz', 'elena.ruiz@email.com', '555-0009', 30),
('Fernando Torres', 'fernando.torres@email.com', '555-0010', 34);

-- Insertar pedidos de ejemplo
INSERT INTO pedidos (usuario_id, producto, descripcion, precio, cantidad, estado, direccion_envio) VALUES 
(1, 'Laptop Dell XPS 13', 'Laptop ultrabook con procesador Intel i7, 16GB RAM, 512GB SSD', 1299.99, 1, 'enviado', 'Calle 123 #45-67, Bogotá'),
(2, 'iPhone 15 Pro', 'Smartphone Apple con 256GB de almacenamiento', 999.99, 1, 'entregado', 'Carrera 50 #30-20, Medellín'),
(3, 'Auriculares Sony WH-1000XM5', 'Auriculares inalámbricos con cancelación de ruido', 299.99, 2, 'procesando', 'Avenida 80 #25-15, Cali'),
(1, 'Mouse Logitech MX Master 3', 'Mouse inalámbrico ergonómico para productividad', 89.99, 1, 'pendiente', 'Calle 123 #45-67, Bogotá'),
(4, 'Teclado Mecánico Corsair K70', 'Teclado gaming mecánico RGB', 149.99, 1, 'enviado', 'Calle 15 #10-25, Barranquilla'),
(5, 'Monitor Samsung 27 pulgadas', 'Monitor 4K UHD para gaming y trabajo', 449.99, 1, 'pendiente', 'Carrera 7 #63-44, Bogotá'),
(2, 'Webcam Logitech C920', 'Cámara web HD para videollamadas', 79.99, 1, 'entregado', 'Carrera 50 #30-20, Medellín'),
(6, 'SSD Samsung 1TB', 'Disco sólido externo para almacenamiento', 199.99, 1, 'procesando', 'Calle 100 #15-30, Bucaramanga'),
(3, 'Tablet iPad Air', 'Tablet Apple con Apple Pencil incluido', 649.99, 1, 'cancelado', 'Avenida 80 #25-15, Cali'),
(7, 'Smartwatch Apple Watch Series 9', 'Reloj inteligente con GPS', 399.99, 1, 'pendiente', 'Carrera 15 #85-20, Bogotá');

-- Verificar que los datos se insertaron correctamente
SELECT 'Usuarios creados:' as info, COUNT(*) as total FROM usuarios;
SELECT 'Pedidos creados:' as info, COUNT(*) as total FROM pedidos;