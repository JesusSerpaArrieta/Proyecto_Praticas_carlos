'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('alquileres', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      cliente_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'clientes', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'RESTRICT',
      },
      prenda_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'prendas', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'RESTRICT',
      },
      fecha_alquiler: { type: Sequelize.DATEONLY, allowNull: false },
      fecha_devolucion: { type: Sequelize.DATEONLY, allowNull: false },
      precio_total: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      estado: {
        type: Sequelize.STRING(20),
        allowNull: false, defaultValue: 'Activo',
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('alquileres');
  },
};
