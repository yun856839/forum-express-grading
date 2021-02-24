const db = require('../models')
const Restaurant = db.Restaurant
const Category = db.Category
const Comment = db.Comment
const User = db.User
const helpers = require('../_helpers')

const pageLimit = 10 //一頁顯示 10 筆

const restService = {
  getTopRestaurants: (req, res, callback) => {
    return Restaurant.findAll({ 
      include: [
        { model: User, as: 'FavoritedUsers' }
      ]
    }).then(restaurants => {      
      restaurants = restaurants.map(restaurant => ({
        ...restaurant.dataValues,
        description: restaurant.description.length > 50 ? restaurant.description.substring(0, 50) : restaurant.description,
        // isFavorited: helpers.getUser(req).FavoritedRestaurants.map(favoritedRest => favoritedRest.id).includes(restaurant.id),
        isFavorited: helpers.getUser(req).FavoritedRestaurants.some(favoritedRest => favoritedRest.id === restaurant.id),
        FavoritedCounts: restaurant.FavoritedUsers.length
      }))
      restaurants = restaurants.sort((a, b) => b.FavoritedCounts - a.FavoritedCounts).slice(0, 10)

      return callback({
        restaurants
      })
    })
  },
  getRestaurants: (req, res, callback) => {
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
        categoryName: r.Category.name,
        // isFavorited: req.user.FavoritedRestaurants.map(d => d.id).includes(r.id),
        // isLiked: req.user.LikedRestaurants.map(d => d.id).includes(r.id)
        isFavorited: req.user.FavoritedRestaurants.some((item) => item.id === r.id),
        isLiked: req.user.LikedRestaurants.some((item) => item.id === r.id)
      }))
      Category.findAll({
        raw: true,
        nest: true
      }).then(categories => {
        return callback({
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
  getRestaurant: async(req, res, callback) => {     
    let restaurant = await Restaurant.findByPk(req.params.id, {
      include: [
        Category,
        { model: User, as: 'LikedUsers' },
        { model: User, as: 'FavoritedUsers' },
        { model: Comment, include: [User] }
      ]
    })
    restaurant.viewCounts++
    restaurant.save()

    const isFavorited = restaurant.FavoritedUsers.some(d => d.id === helpers.getUser(req).id)
    const isLiked = restaurant.LikedUsers.some(d => d.id === helpers.getUser(req).id)     

    return callback({
      restaurant: restaurant.toJSON(),
      isFavorited,
      isLiked
    })

    // return Restaurant.findByPk(req.params.id, {
    //   include: [
    //     Category,
    //     { model: User, as: 'LikedUsers' },
    //     { model: User, as: 'FavoritedUsers' },
    //     { model: Comment, include: [User] }
    //   ]
    // }).then(restaurant => {
    //   restaurant.viewCounts++
    //   restaurant.save().then(restaurant => {
    //     const isFavorited = restaurant.FavoritedUsers.map(d => d.id).includes(helpers.getUser(req).id)
    //     const isLiked = restaurant.LikedUsers.map(d => d.id).includes(helpers.getUser(req).id)
    //     return res.render('restaurant', {
    //       restaurant: restaurant.toJSON(),
    //       isFavorited,
    //       isLiked
    //     })
    //   })
    // })
  },
  getFeeds: async(req, res, callback) => {    
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
    return callback({
      restaurants,
      comments
    })
    

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
  getDashboard: (req, res, callback) => {
    return Restaurant.findByPk(req.params.id, {
      include: [
        Category,
        { model: User, as: 'FavoritedUsers' },
        { model: Comment, include: [User] }
      ]
    }).then(restaurant => {      
      return callback({
        restaurant: restaurant.toJSON()
      })
    })
  }
}

module.exports = restService