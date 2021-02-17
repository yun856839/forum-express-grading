const db = require('../models')
const Category = db.Category
const Restaurant = db.Restaurant

const adminService = {
  getRestaurants: (req, res, callback) => {
    // {raw: true} 轉換成 JS 原生物件。
    return Restaurant.findAll({
      raw: true,
      nest: true,
      include: [Category]
    }).then(restaurants => {
      callback({ restaurants })
    })
  },
  getRestaurant: (req, res, callback) => {
    return Restaurant.findByPk(req.params.id, {
      raw: true,
      nest: true,
      include: [Category]
    }).then(restaurant => {
      callback({ restaurant })
    })
  },
}

module.exports = adminService