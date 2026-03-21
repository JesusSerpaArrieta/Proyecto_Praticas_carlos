const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const DañoPrenda = sequelize.define(
    'DañoPrenda',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      prenda_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'prendas', key: 'id' } },
      alquiler_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'alquileres', key: 'id' } },
      descripcion: { type: DataTypes.STRING(500), allowNull: false },
      foto_url: { type: DataTypes.STRING(500), allowNull: true },
      costo_dano: { type: DataTypes.DECIMAL(10, 2), allowNull: true, defaultValue: null },
      resuelto: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    },
    { tableName: 'danos_prenda', timestamps: true, underscored: true }
  );
  return DañoPrenda;
};
