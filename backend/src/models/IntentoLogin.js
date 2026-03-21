const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const IntentoLogin = sequelize.define(
    'IntentoLogin',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      email: { type: DataTypes.STRING(150), allowNull: false, unique: true },
      intentos_fallidos: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      bloqueado_hasta: { type: DataTypes.DATE, allowNull: true },
      updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    },
    { tableName: 'intentos_login', timestamps: false }
  );

  return IntentoLogin;
};
