'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('danos_prenda', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      prenda_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'prendas', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'RESTRICT',
      },
      alquiler_id: {
        type: Sequelize.INTEGER, allowNull: true,
        references: { model: 'alquileres', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'NO ACTION',
      },
      descripcion: { type: Sequelize.STRING(500), allowNull: false },
      foto_url: { type: Sequelize.STRING(500), allowNull: true },
      costo_dano: { type: Sequelize.DECIMAL(10, 2), allowNull: true },
      resuelto: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('danos_prenda');
  },
};
