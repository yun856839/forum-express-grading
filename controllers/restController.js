const db = require('../models')
const Restaurant = db.Restaurant
const Category = db.Category
const Comment = db.Comment
const User = db.User

const pageLimit = 10 //一頁顯示 10 筆

const restController = {
  getRestaurants: (req, res) => {
    const whereQuery = {}
    let categoryId = ''
    let offset = 0

    if (req.query.page) {
      offset = (req.query.page - 1) * pageLimit
    }

    if (req.query.categoryId) {
      categoryId = Number(req.query.categoryId)
      whereQuery.CategoryId = categoryId
    }
    Restaurant.findAndCountAll({ include: Category, where: whereQuery, offset, limit: pageLimit }).then(result => {
      const page = Number(req.query.page) || 1 // 頁數沒有零
      const pages = Math.ceil(result.count / pageLimit) //最大頁數
      const totalPage = Array.from({ length: pages }).map((item, index) => index + 1) // 總共有幾頁 1.2.3.4.5.6
      const prev = page - 1 < 1 ? 1 : page - 1
      const next = page + 1 < pages ? pages : page + 1

      const data = result.rows.map(r => ({
        ...r.dataValues,
        description: r.dataValues.description.substring(0, 50),
        categoryName: r.Category.name
      }))
      Category.findAll({
        raw: true,
        nest: true
      }).then(categories => {
        return res.render('restaurants', {
          restaurants: data,
          categories,
          categoryId,
          page,
          totalPage,
          prev,
          next
        })
      })
    })
  },

  getRestaurant: (req, res) => {
    return Restaurant.findByPk(req.params.id, {
      include: [
        Category,
        { model: Comment, include: [User] }
      ]
    }).then(restaurant => {
      return res.render('restaurant', {
        restaurant: restaurant.toJSON()
      })
    })
  },

  getFeeds: (req, res) => {
    async function getFeeds() {
      let restaurants = await Restaurant.findAll({
        limit: 10,
        raw: true,
        nest: true,
        order: [['createdAt', 'DESC']],
        include: [Category]
      })
      let comments = await Comment.findAll({
        limit: 10,
        raw: true,
        nest: true,
        order: [['createdAt', 'DESC']],
        include: [User, Restaurant]
      })
      return res.render('feeds', {
        restaurants,
        comments
      })
    }
    getFeeds()

    //   return Promise.all([
    //     Restaurant.findAll({
    //       limit: 10,
    //       raw: true,
    //       nest: true,
    //       order: [['createdAt', 'DESC']],
    //       include: [Category]
    //     }),
    //     Comment.findAll({
    //       limit: 10,
    //       raw: true,
    //       nest: true,
    //       order: [['createdAt', 'DESC']],
    //       include: [User, Restaurant]
    //     })
    //   ]).then(([restaurants, comments]) => {
    //     return res.render('feeds', {
    //       restaurants,
    //       comments
    //     })
    //   })
  },

  getDashboard: (req, res) => {
    return Restaurant.findByPk(req.params.id, {
      include: [
        Category,
        { model: Comment, include: [User] }
      ]
    }).then(restaurant => {
      return res.render('dashboard', {
        restaurant: restaurant.toJSON()
      })
    })
  }
}

module.exports = restController