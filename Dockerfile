# Dockerfile multi-etapa para servicios de Node.js
FROM node:18-alpine AS base

# Instalar dependencias del sistema
RUN apk add --no-cache dumb-init wget

# Crear directorio de la aplicación
WORKDIR /app

# Copiar archivos de configuración npm
COPY .npmrc ./

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias con mejor compatibilidad para Windows y crear usuario
RUN npm config set fund false && \
    npm config set audit false && \
    npm install --only=production --no-optional && \
    npm cache clean --force && \
    addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Crear usuario no-root por seguridad

# Imagen para servicio de usuarios
FROM base AS user-service

# Copiar código fuente
COPY userService.js database.js ./

# Cambiar propiedad de archivos
RUN chown -R nodejs:nodejs /app
USER nodejs

# Exponer puerto
EXPOSE 5001

# Comando de inicio
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "userService.js"]

# Imagen para servicio de pedidos
FROM base AS order-service

# Copiar código fuente
COPY orderService.js database.js ./

# Cambiar propiedad de archivos
RUN chown -R nodejs:nodejs /app
USER nodejs

# Exponer puerto
EXPOSE 5002

# Comando de inicio
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "orderService.js"]