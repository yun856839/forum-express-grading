'use strict';
const faker = require('faker')

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('Comments',
      Array.from({ length: 8 }).map((d, i) => ({
        id: i * 10 + 1,
        text: faker.lorem.words(),
        UserId: Math.floor(Math.random() * 3) * 10 + 1,
        RestaurantId: Math.floor(Math.random() * 8) * 10 + 1, // * 50
        createdAt: new Date(),
        updatedAt: new Date()
      })
      ), {})
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Comments', null, {})
  }
};
