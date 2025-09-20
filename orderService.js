const express = require("express");
const cors = require("cors");
const axios = require("axios");
const { pool, testConnection } = require("./database");
require('dotenv').config();

const app = express();
const PORT = process.env.ORDER_SERVICE_PORT || 5002;
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:5001';

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware para manejo de errores
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Función para obtener datos del usuario desde el servicio de usuarios
async function getUserData(userId) {
  try {
    console.log(`📞 Llamando al servicio de usuarios para obtener datos del usuario ${userId}...`);
    const response = await axios.get(`${USER_SERVICE_URL}/usuarios/${userId}`, {
      timeout: 5000 // 5 segundos de timeout
    });
    
    if (response.data.success) {
      console.log(`✅ Datos del usuario ${userId} obtenidos correctamente`);
      return response.data.data;
    } else {
      console.warn(`⚠️ El servicio de usuarios respondió sin éxito para usuario ${userId}`);
      return null;
    }
  } catch (error) {
    console.warn(`⚠️ No se pudo obtener datos del usuario ${userId}:`, error.code || error.message);
    return null;
  }
}

// Función para validar que existe un usuario antes de crear pedido
async function validateUser(userId) {
  try {
    console.log(`📞 Validando existencia del usuario ${userId} en el servicio de usuarios...`);
    const response = await axios.get(`${USER_SERVICE_URL}/usuarios/${userId}`, {
      timeout: 5000
    });
    const isValid = response.data.success;
    console.log(`${isValid ? '✅' : '❌'} Usuario ${userId} ${isValid ? 'existe' : 'no existe'}`);
    return isValid;
  } catch (error) {
    console.warn(`⚠️ Error al validar usuario ${userId}:`, error.code || error.message);
    return false;
  }
}

// 🔍 READ - Obtener todos los pedidos
app.get("/pedidos", asyncHandler(async (req, res) => {
  try {
    const { estado, usuario_id, limit = 50, offset = 0 } = req.query;
    
    let whereClause = '';
    let queryParams = [];
    const conditions = [];
    
    if (estado) {
      conditions.push('estado = ?');
      queryParams.push(estado);
    }
    
    if (usuario_id) {
      conditions.push('usuario_id = ?');
      queryParams.push(usuario_id);
    }
    
    if (conditions.length > 0) {
      whereClause = 'WHERE ' + conditions.join(' AND ');
    }
    
    queryParams.push(parseInt(limit), parseInt(offset));
    
    // Obtener pedidos sin información de usuarios
    const [rows] = await pool.execute(`
      SELECT * FROM pedidos
      ${whereClause}
      ORDER BY id ASC
      LIMIT ? OFFSET ?
    `, queryParams);

    // Enriquecer cada pedido con información del usuario usando Axios
    console.log(`🔍 Obteniendo información de usuarios para ${rows.length} pedidos...`);
    const enrichedPedidos = await Promise.all(rows.map(async (pedido) => {
      const userData = await getUserData(pedido.usuario_id);
      return {
        ...pedido,
        nombre_usuario: userData ? userData.nombre : null,
        email_usuario: userData ? userData.email : null,
        telefono_usuario: userData ? userData.telefono : null
      };
    }));

    res.json({
      success: true,
      data: enrichedPedidos,
      total: enrichedPedidos.length,
      filters: {
        estado: estado || null,
        usuario_id: usuario_id ? parseInt(usuario_id) : null
      },
      integration: "Datos enriquecidos con servicio de usuarios via Axios"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Error al obtener pedidos",
      details: error.message
    });
  }
}));

// 🔍 READ - Obtener pedido por ID
app.get("/pedidos/:id", asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute('SELECT * FROM pedidos WHERE id = ?', [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Pedido no encontrado"
      });
    }

    // Enriquecer con datos del usuario usando Axios
    const pedido = rows[0];
    console.log(`🔍 Obteniendo datos del usuario ${pedido.usuario_id} via Axios...`);
    const userData = await getUserData(pedido.usuario_id);
    
    if (userData) {
      pedido.nombre_usuario = userData.nombre;
      pedido.email_usuario = userData.email;
      pedido.telefono_usuario = userData.telefono;
    }
    
    res.json({
      success: true,
      data: pedido,
      integration: "Datos del usuario obtenidos via Axios"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Error al obtener pedido",
      details: error.message
    });
  }
}));
// 🔍 READ - Obtener pedidos por usuario
app.get("/usuarios/:userId/pedidos", asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Primero validar que el usuario existe
    console.log(`🔍 Validando usuario ${userId} via Axios...`);
    const userExists = await validateUser(userId);
    if (!userExists) {
      return res.status(404).json({
        success: false,
        error: `Usuario con ID ${userId} no encontrado`
      });
    }

    // Obtener pedidos del usuario
    const [rows] = await pool.execute(
      'SELECT * FROM pedidos WHERE usuario_id = ? ORDER BY id ASC',
      [userId]
    );
    
    // Enriquecer con datos del usuario usando Axios
    const userData = await getUserData(userId);
    const enrichedPedidos = rows.map(pedido => ({
      ...pedido,
      nombre_usuario: userData ? userData.nombre : null,
      email_usuario: userData ? userData.email : null,
      telefono_usuario: userData ? userData.telefono : null
    }));
    
    res.json({
      success: true,
      data: enrichedPedidos,
      total: enrichedPedidos.length,
      usuario_id: parseInt(userId),
      integration: "Usuario validado y datos enriquecidos via Axios"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Error al obtener pedidos del usuario",
      details: error.message
    });
  }
}));

// ✏️ CREATE - Crear nuevo pedido
app.post("/pedidos", asyncHandler(async (req, res) => {
  try {
    const { usuario_id, producto, descripcion, precio, cantidad, direccion_envio } = req.body;
    
    // Validaciones básicas
    if (!usuario_id || !producto || !precio || !direccion_envio) {
      return res.status(400).json({
        success: false,
        error: "Usuario ID, producto, precio y dirección de envío son requeridos"
      });
    }

    // Validar que el usuario existe usando el servicio de usuarios
    console.log(`🔍 Validando usuario ${usuario_id} con servicio de usuarios...`);
    const userExists = await validateUser(usuario_id);
    if (!userExists) {
      return res.status(400).json({
        success: false,
        error: `Usuario con ID ${usuario_id} no encontrado en el sistema`
      });
    }

    // Crear nuevo pedido
    const [result] = await pool.execute(
      `INSERT INTO pedidos (usuario_id, producto, descripcion, precio, cantidad, direccion_envio, estado, fecha_pedido) 
       VALUES (?, ?, ?, ?, ?, ?, 'pendiente', NOW())`,
      [usuario_id, producto, descripcion || null, precio, cantidad || 1, direccion_envio]
    );

    // Obtener el pedido creado con información del usuario
    const [newPedido] = await pool.execute(
      'SELECT * FROM pedidos WHERE id = ?',
      [result.insertId]
    );

    // Obtener datos adicionales del usuario
    const userData = await getUserData(usuario_id);
    if (userData) {
      newPedido[0].nombre_usuario = userData.nombre;
      newPedido[0].email_usuario = userData.email;
    }

    res.status(201).json({
      success: true,
      message: "Pedido creado exitosamente",
      data: newPedido[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Error al crear pedido",
      details: error.message
    });
  }
}));

// ✏️ UPDATE - Actualizar pedido
app.put("/pedidos/:id", asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { producto, descripcion, precio, cantidad, estado, direccion_envio } = req.body;

    // Verificar que el pedido existe
    const [existingPedido] = await pool.execute('SELECT * FROM pedidos WHERE id = ?', [id]);
    
    if (existingPedido.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Pedido no encontrado"
      });
    }

    // Preparar campos para actualizar
    const updates = {};
    if (producto !== undefined) updates.producto = producto;
    if (descripcion !== undefined) updates.descripcion = descripcion;
    if (precio !== undefined) updates.precio = precio;
    if (cantidad !== undefined) updates.cantidad = cantidad;
    if (estado !== undefined) updates.estado = estado;
    if (direccion_envio !== undefined) updates.direccion_envio = direccion_envio;

    // Agregar timestamp de actualización
    updates.fecha_actualizacion = new Date().toISOString().slice(0, 19).replace('T', ' ');

    // Construir query dinámico
    const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    values.push(id);

    await pool.execute(
      `UPDATE pedidos SET ${setClause} WHERE id = ?`,
      values
    );

    // Obtener el pedido actualizado
    const [updatedPedido] = await pool.execute('SELECT * FROM pedidos WHERE id = ?', [id]);

    res.json({
      success: true,
      message: "Pedido actualizado exitosamente",
      data: updatedPedido[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Error al actualizar pedido",
      details: error.message
    });
  }
}));

// 🗑️ DELETE - Eliminar pedido
app.delete("/pedidos/:id", asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar que el pedido existe
    const [existingPedido] = await pool.execute('SELECT * FROM pedidos WHERE id = ?', [id]);
    
    if (existingPedido.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Pedido no encontrado"
      });
    }

    // Eliminar el pedido
    await pool.execute('DELETE FROM pedidos WHERE id = ?', [id]);

    res.json({
      success: true,
      message: "Pedido eliminado exitosamente",
      data: existingPedido[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Error al eliminar pedido",
      details: error.message
    });
  }
}));

// 📊 Endpoint para estadísticas de pedidos
app.get("/pedidos/estadisticas/resumen", asyncHandler(async (req, res) => {
  try {
    const [stats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_pedidos,
        COUNT(CASE WHEN estado = 'pendiente' THEN 1 END) as pedidos_pendientes,
        COUNT(CASE WHEN estado = 'procesando' THEN 1 END) as pedidos_procesando,
        COUNT(CASE WHEN estado = 'enviado' THEN 1 END) as pedidos_enviados,
        COUNT(CASE WHEN estado = 'entregado' THEN 1 END) as pedidos_entregados,
        COUNT(CASE WHEN estado = 'cancelado' THEN 1 END) as pedidos_cancelados,
        COALESCE(SUM(precio * cantidad), 0) as valor_total,
        COALESCE(AVG(precio * cantidad), 0) as valor_promedio
      FROM pedidos
    `);

    res.json({
      success: true,
      data: stats[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Error al obtener estadísticas",
      details: error.message
    });
  }
}));

// 🔍 SEARCH - Buscar pedidos por término
app.get("/pedidos/buscar/:termino", asyncHandler(async (req, res) => {
  try {
    const { termino } = req.params;
    
    if (!termino || termino.length < 2) {
      return res.status(400).json({
        success: false,
        error: "El término de búsqueda debe tener al menos 2 caracteres"
      });
    }

    const [rows] = await pool.execute(`
      SELECT * FROM pedidos
      WHERE producto LIKE ? OR descripcion LIKE ?
      ORDER BY id ASC
    `, [`%${termino}%`, `%${termino}%`]);

    // Enriquecer con datos de usuarios usando Axios
    console.log(`🔍 Enriqueciendo ${rows.length} pedidos encontrados con datos de usuarios...`);
    const enrichedPedidos = await Promise.all(rows.map(async (pedido) => {
      const userData = await getUserData(pedido.usuario_id);
      return {
        ...pedido,
        nombre_usuario: userData ? userData.nombre : null,
        email_usuario: userData ? userData.email : null,
        telefono_usuario: userData ? userData.telefono : null
      };
    }));

    res.json({
      success: true,
      data: enrichedPedidos,
      total: enrichedPedidos.length,
      termino_busqueda: termino,
      integration: "Resultados enriquecidos con servicio de usuarios via Axios"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Error al buscar pedidos",
      details: error.message
    });
  }
}));

// 📈 STATS - Estadísticas detalladas de pedidos
app.get("/pedidos/stats/resumen", asyncHandler(async (req, res) => {
  try {
    const [stats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_pedidos,
        COUNT(CASE WHEN estado = 'pendiente' THEN 1 END) as pendientes,
        COUNT(CASE WHEN estado = 'procesando' THEN 1 END) as procesando,
        COUNT(CASE WHEN estado = 'enviado' THEN 1 END) as enviados,
        COUNT(CASE WHEN estado = 'entregado' THEN 1 END) as entregados,
        COUNT(CASE WHEN estado = 'cancelado' THEN 1 END) as cancelados,
        COALESCE(SUM(precio * cantidad), 0) as valor_total,
        COALESCE(AVG(precio * cantidad), 0) as valor_promedio
      FROM pedidos
    `);

    res.json({
      success: true,
      data: stats[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Error al obtener estadísticas de resumen",
      details: error.message
    });
  }
}));

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Servicio de pedidos funcionando correctamente",
    timestamp: new Date().toISOString(),
    database: "MariaDB local",
    user_service: USER_SERVICE_URL,
    features: {
      axios_integration: true,
      user_validation: true,
      enriched_data: true
    },
    endpoints_disponibles: [
      "GET /pedidos - Obtener todos los pedidos",
      "GET /pedidos/:id - Obtener pedido por ID",
      "GET /usuarios/:userId/pedidos - Obtener pedidos por usuario",
      "POST /pedidos - Crear nuevo pedido",
      "PUT /pedidos/:id - Actualizar pedido",
      "DELETE /pedidos/:id - Eliminar pedido",
      "GET /pedidos/buscar/:termino - Buscar pedidos",
      "GET /pedidos/stats/resumen - Estadísticas de pedidos",
      "GET /pedidos/estadisticas/resumen - Estadísticas detalladas"
    ]
  });
});

// Middleware de manejo de errores
app.use((err, req, res, next) => {
  console.error("❌ Error:", err);
  res.status(500).json({
    success: false,
    error: "Error interno del servidor",
    details: err.message
  });
});

// Manejar rutas no encontradas
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    error: "Ruta no encontrada"
  });
});

// Función para iniciar el servidor
async function startServer() {
  try {
    // Probar conexión a la base de datos
    const connected = await testConnection();
    if (!connected) {
      console.error('❌ No se pudo conectar a la base de datos. Cerrando servidor...');
      process.exit(1);
    }

    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`🚀 Servicio de Pedidos ejecutándose en puerto ${PORT}`);
      console.log(`📱 Health check: http://localhost:${PORT}/health`);
      console.log(`🗄️  Conectado a MariaDB local`);
      console.log(`📊 Endpoints disponibles:`);
      console.log(`   GET    /pedidos                    - Obtener todos los pedidos`);
      console.log(`   GET    /pedidos/:id                - Obtener pedido por ID`);
      console.log(`   GET    /usuarios/:userId/pedidos   - Obtener pedidos de un usuario`);
      console.log(`   POST   /pedidos                    - Crear nuevo pedido`);
      console.log(`   PUT    /pedidos/:id                - Actualizar pedido`);
      console.log(`   DELETE /pedidos/:id                - Eliminar pedido`);
      console.log(`   GET    /pedidos/buscar/:termino    - Buscar pedidos`);
      console.log(`   GET    /pedidos/stats/resumen      - Estadísticas de pedidos`);
      console.log(`   GET    /health                     - Estado del servicio`);
      console.log(`🔗 Conectado al servicio de usuarios en: ${USER_SERVICE_URL}`);
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

// Iniciar el servidor
startServer();