const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Factura = sequelize.define(
    'Factura',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      alquiler_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        references: { model: 'alquileres', key: 'id' },
      },
      numero_factura: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
      },
      fecha_emision: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      estado_pago: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'Pendiente',
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      tableName: 'facturas',
      timestamps: false,
    }
  );

  return Factura;
};
