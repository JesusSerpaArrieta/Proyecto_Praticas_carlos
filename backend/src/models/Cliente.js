const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Cliente = sequelize.define(
    'Cliente',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      nombre_completo: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      cedula: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
      },
      telefono: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      direccion: {
        type: DataTypes.STRING(300),
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING(150),
        allowNull: false,
        validate: {
          isEmail: {
            msg: 'El correo electrónico no tiene un formato válido.',
          },
        },
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'clientes',
      timestamps: false,
    }
  );

  return Cliente;
};
