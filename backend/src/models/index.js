require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      logging: false,
      dialectOptions: {
        ssl: process.env.DB_SSL === 'true' ? { require: true, rejectUnauthorized: false } : false,
      },
    })
  : new Sequelize(
      process.env.DB_NAME,
      process.env.DB_USER,
      process.env.DB_PASS,
      {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        dialect: 'postgres',
        logging: false,
        dialectOptions: {
          ssl: process.env.DB_SSL === 'true' ? { require: true, rejectUnauthorized: false } : false,
        },
      }
    );

const Usuario = require('./Usuario')(sequelize);
const Prenda = require('./Prenda')(sequelize);
const Cliente = require('./Cliente')(sequelize);
const Alquiler = require('./Alquiler')(sequelize);
const Factura = require('./Factura')(sequelize);
const IntentoLogin = require('./IntentoLogin')(sequelize);
const DañoPrenda = require('./DañoPrenda')(sequelize);

// Associations
Cliente.hasMany(Alquiler, { foreignKey: 'cliente_id', as: 'alquileres' });
Alquiler.belongsTo(Cliente, { foreignKey: 'cliente_id', as: 'cliente' });

Prenda.hasMany(Alquiler, { foreignKey: 'prenda_id', as: 'alquileres' });
Alquiler.belongsTo(Prenda, { foreignKey: 'prenda_id', as: 'prenda' });

Alquiler.hasOne(Factura, { foreignKey: 'alquiler_id', as: 'factura' });
Factura.belongsTo(Alquiler, { foreignKey: 'alquiler_id', as: 'alquiler' });

Prenda.hasMany(DañoPrenda, { foreignKey: 'prenda_id', as: 'daños' });
DañoPrenda.belongsTo(Prenda, { foreignKey: 'prenda_id', as: 'prenda' });

Alquiler.hasMany(DañoPrenda, { foreignKey: 'alquiler_id', as: 'daños', onDelete: 'NO ACTION', hooks: false });
DañoPrenda.belongsTo(Alquiler, { foreignKey: 'alquiler_id', as: 'alquiler', onDelete: 'NO ACTION' });

module.exports = { sequelize, Usuario, Prenda, Cliente, Alquiler, Factura, IntentoLogin, DañoPrenda };
