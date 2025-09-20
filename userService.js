const express = require("express");
const cors = require("cors");
const { pool, testConnection } = require("./database");
require('dotenv').config();

const app = express();
const PORT = process.env.USER_SERVICE_PORT || 5001;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware para manejo de errores
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// 🔍 READ - Obtener todos los usuarios
app.get("/usuarios", asyncHandler(async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM usuarios ORDER BY id');
    res.json({
      success: true,
      data: rows,
      total: rows.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Error al obtener usuarios",
      details: error.message
    });
  }
}));

// 🔍 READ - Obtener usuario por ID
app.get("/usuarios/:id", asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute('SELECT * FROM usuarios WHERE id = ?', [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Usuario no encontrado"
      });
    }
    
    res.json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Error al obtener usuario",
      details: error.message
    });
  }
}));

// ✅ CREATE - Crear nuevo usuario
app.post("/usuarios", asyncHandler(async (req, res) => {
  try {
    const { nombre, email, telefono, edad } = req.body;
    
    // Validar campos requeridos
    if (!nombre || !email) {
      return res.status(400).json({
        success: false,
        error: "Nombre y email son requeridos"
      });
    }
    
    const [result] = await pool.execute(
      'INSERT INTO usuarios (nombre, email, telefono, edad) VALUES (?, ?, ?, ?)',
      [nombre, email, telefono || null, edad || null]
    );
    
    // Obtener el usuario recién creado
    const [newUser] = await pool.execute(
      'SELECT * FROM usuarios WHERE id = ?',
      [result.insertId]
    );
    
    res.status(201).json({
      success: true,
      message: "Usuario creado exitosamente",
      data: newUser[0]
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        error: "El email ya está registrado"
      });
    }
    res.status(500).json({
      success: false,
      error: "Error al crear usuario",
      details: error.message
    });
  }
}));

// ✏️ UPDATE - Actualizar usuario
app.put("/usuarios/:id", asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, email, telefono, edad } = req.body;
    
    // Verificar si el usuario existe
    const [existingUser] = await pool.execute('SELECT * FROM usuarios WHERE id = ?', [id]);
    if (existingUser.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Usuario no encontrado"
      });
    }
    
    // Construir la consulta dinámicamente
    const updates = [];
    const values = [];
    
    if (nombre !== undefined) {
      updates.push('nombre = ?');
      values.push(nombre);
    }
    if (email !== undefined) {
      updates.push('email = ?');
      values.push(email);
    }
    if (telefono !== undefined) {
      updates.push('telefono = ?');
      values.push(telefono);
    }
    if (edad !== undefined) {
      updates.push('edad = ?');
      values.push(edad);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No se proporcionaron campos para actualizar"
      });
    }
    
    values.push(id);
    
    await pool.execute(
      `UPDATE usuarios SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    
    // Obtener el usuario actualizado
    const [updatedUser] = await pool.execute('SELECT * FROM usuarios WHERE id = ?', [id]);
    
    res.json({
      success: true,
      message: "Usuario actualizado exitosamente",
      data: updatedUser[0]
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        error: "El email ya está registrado"
      });
    }
    res.status(500).json({
      success: false,
      error: "Error al actualizar usuario",
      details: error.message
    });
  }
}));

// 🗑️ DELETE - Eliminar usuario
app.delete("/usuarios/:id", asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar si el usuario existe
    const [existingUser] = await pool.execute('SELECT * FROM usuarios WHERE id = ?', [id]);
    if (existingUser.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Usuario no encontrado"
      });
    }
    
    await pool.execute('DELETE FROM usuarios WHERE id = ?', [id]);
    
    res.json({
      success: true,
      message: "Usuario eliminado exitosamente",
      data: existingUser[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Error al eliminar usuario",
      details: error.message
    });
  }
}));

// 🔍 Búsqueda de usuarios por nombre o email
app.get("/usuarios/buscar/:termino", asyncHandler(async (req, res) => {
  try {
    const { termino } = req.params;
    const [rows] = await pool.execute(
      'SELECT * FROM usuarios WHERE nombre LIKE ? OR email LIKE ? ORDER BY nombre',
      [`%${termino}%`, `%${termino}%`]
    );
    
    res.json({
      success: true,
      data: rows,
      total: rows.length,
      termino_busqueda: termino
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Error al buscar usuarios",
      details: error.message
    });
  }
}));

// Endpoint de salud
app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Servicio de usuarios funcionando correctamente",
    timestamp: new Date().toISOString()
  });
});

// Manejo de errores global
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({
    success: false,
    error: "Error interno del servidor",
    details: error.message
  });
});

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Ruta no encontrada"
  });
});

// Iniciar servidor
async function startServer() {
  try {
    // Probar conexión a la base de datos
    const isConnected = await testConnection();
    if (!isConnected) {
      console.error('No se pudo conectar a la base de datos. Verifica la configuración.');
      process.exit(1);
    }
    
    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`🚀 Servicio de Usuarios corriendo en http://localhost:${PORT}`);
      console.log(`📊 Endpoints disponibles:`);
      console.log(`   GET    /usuarios          - Obtener todos los usuarios`);
      console.log(`   GET    /usuarios/:id      - Obtener usuario por ID`);
      console.log(`   POST   /usuarios          - Crear nuevo usuario`);
      console.log(`   PUT    /usuarios/:id      - Actualizar usuario`);
      console.log(`   DELETE /usuarios/:id      - Eliminar usuario`);
      console.log(`   GET    /usuarios/buscar/:termino - Buscar usuarios`);
      console.log(`   GET    /health            - Estado del servicio`);
    });
  } catch (error) {
    console.error('Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

startServer();
