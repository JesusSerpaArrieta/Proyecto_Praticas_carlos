const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Alquiler = sequelize.define(
    'Alquiler',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      cliente_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'clientes', key: 'id' },
      },
      prenda_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'prendas', key: 'id' },
      },
      fecha_alquiler: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      fecha_devolucion: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
          isAfterFechaAlquiler(value) {
            if (value <= this.fecha_alquiler) {
              throw new Error('La fecha de devolución debe ser posterior a la fecha de alquiler.');
            }
          },
        },
      },
      precio_total: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      estado: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'Activo',
        validate: {
          isIn: [['Activo', 'Devuelto', 'Vencido']],
        },
      },
      notas: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
    },
    {
      tableName: 'alquileres',
      timestamps: true,
      underscored: true,
    }
  );

  return Alquiler;
};
