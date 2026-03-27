require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}));
app.use(express.json());

// Crear carpeta de uploads si no existe
const uploadsDir = '/app/uploads';
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Servir imágenes subidas
app.use('/uploads', express.static(uploadsDir));

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

const authMiddleware = require('./middlewares/authMiddleware');
app.post('/api/uploads', authMiddleware, require('./controllers/uploadController').subirImagen);

app.use('/api/auth', require('./routes/auth'));
app.use('/api/prendas', require('./routes/prendas'));
app.use('/api/clientes', require('./routes/clientes'));
app.use('/api/alquileres', require('./routes/alquileres'));
app.use('/api/facturas', require('./routes/facturas'));
app.use('/api/reportes', require('./routes/reportes'));

async function seedAdminUser() {
  const bcrypt = require('bcrypt');
  const { Usuario } = require('./models');
  const email = process.env.ADMIN_EMAIL || 'admin@rental.com';
  const password = process.env.ADMIN_PASSWORD || 'Admin123!';
  const existing = await Usuario.findOne({ where: { email } });
  if (!existing) {
    const password_hash = await bcrypt.hash(password, 10);
    await Usuario.create({ nombre: 'Administrador', email, password_hash, created_at: new Date() });
    console.log(`Usuario admin creado: ${email}`);
  }
}

async function ensureColumns() {
  const { sequelize } = require('./models');
  // PostgreSQL: usar DO $$ ... $$ para condicionales
  await sequelize.query(`
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'danos_prenda' AND column_name = 'costo_dano'
      ) THEN
        ALTER TABLE danos_prenda ADD COLUMN costo_dano DECIMAL(10,2) NULL;
      END IF;
    END $$;
  `);
  await sequelize.query(`
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'facturas' AND column_name = 'estado_pago'
      ) THEN
        ALTER TABLE facturas ADD COLUMN estado_pago VARCHAR(20) NOT NULL DEFAULT 'Pendiente';
      END IF;
    END $$;
  `);
  await sequelize.query(`
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'alquileres' AND column_name = 'notas'
      ) THEN
        ALTER TABLE alquileres ADD COLUMN notas VARCHAR(500) NULL;
      END IF;
    END $$;
  `);
}

async function startWithRetry(retries = 10, delayMs = 5000) {
  for (let i = 1; i <= retries; i++) {
    try {
      const { sequelize } = require('./models');
      await sequelize.authenticate();
      console.log('Conexión a la base de datos establecida.');

      await sequelize.sync();
      console.log('Tablas sincronizadas.');

      await ensureColumns();
      console.log('Columnas verificadas.');

      await seedAdminUser();

      app.listen(PORT, () => {
        console.log(`Servidor corriendo en puerto ${PORT}`);
        const { marcarVencidos } = require('./services/alquilerService');
        const { enviarRecordatoriosDiarios } = require('./services/notificacionService');
        marcarVencidos().catch(console.error);
        // Cron cada hora: marcar vencidos + enviar recordatorios
        setInterval(() => {
          marcarVencidos().catch(console.error);
          enviarRecordatoriosDiarios().catch(console.error);
        }, 60 * 60 * 1000);
        // Enviar recordatorios al arrancar también
        enviarRecordatoriosDiarios().catch(console.error);
      });
      return;
    } catch (err) {
      console.error(`Intento ${i}/${retries} fallido:`, err.message || err);
      if (i === retries) {
        console.error('No se pudo conectar a la base de datos. Saliendo.');
        process.exit(1);
      }
      console.log(`Reintentando en ${delayMs / 1000}s...`);
      await new Promise(res => setTimeout(res, delayMs));
    }
  }
}

startWithRetry();

module.exports = app;
