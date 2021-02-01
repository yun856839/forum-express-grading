const db = require('../models')
const Restaurant = db.Restaurant


const adminController = {
  getRestaurants: (req, res) => {
    // {raw: true} 轉換成 JS 原生物件。
    return Restaurant.findAll({ raw: true }).then(restaurants => {
      return res.render('admin/restaurants', { restaurants })
    })
  }
}

module.exports = adminController