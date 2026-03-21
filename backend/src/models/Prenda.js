const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Prenda = sequelize.define(
    'Prenda',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      tipo: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      talla: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      color: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      precio_por_dia: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          min: {
            args: [0.01],
            msg: 'El precio por día debe ser mayor a cero.',
          },
        },
      },
      estado: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'Disponible',
        validate: {
          isIn: [['Disponible', 'Alquilada', 'En_Mantenimiento']],
        },
      },
      foto_url: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
    },
    {
      tableName: 'prendas',
      timestamps: true,
      underscored: true,
    }
  );

  return Prenda;
};
