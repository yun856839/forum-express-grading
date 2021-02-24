const db = require('../models')
const Restaurant = db.Restaurant
const Comment = db.Comment
const User = db.User
const Favorite = db.Favorite
const Like = db.Like
const Followship = db.Followship
const imgur = require('imgur')
const IMGUR_CLIENT_ID = process.env.IMGUR_CLIENT_ID
const helpers = require('../_helpers')

const userService = {
  // 瀏覽 Profile  
  getUser: (req, res, callback) => {
    return User.findByPk(req.params.id, {
      include: [
        { model: Restaurant, as: 'FavoritedRestaurants' },
        { model: User, as: 'Followers' },
        { model: User, as: 'Followings' },
        { model: Comment, include: [Restaurant] }
      ]
    }).then(user => {
      if (!user) {
      return callback({ status: 'error', message: 'user doesn\'t exist' })
      }

      const commentedRests = user.toJSON().Comments.map(comment => ({ ...comment.Restaurant }))      

      const set = new Set();
      const noRepeatCommentRests = commentedRests.filter(item => !set.has(item.id) ? set.add(item.id) : false);      
      const isFollowed = helpers.getUser(req).Followings.some(d => d.id === user.id)
      // const isFollowed = helpers.getUser(req).Followings.map(d => d.id).includes(user.id)

      return callback({
        profile: user.toJSON(),
        noRepeatCommentRests,
        isFollowed
      })
    })
  },
  // 瀏覽編輯 Profile 頁面
  editUser: (req, res, callback) => {
    return User.findByPk(req.params.id).then(user => callback({ profile: user.toJSON() }))
  },
  // 編輯 Profile
  putUser: async(req, res, callback) => {
    if (!req.body.name.trim()) {
      return callback({ status: 'error', message: 'name didn\'t exist' })
    }

    const { file } = req  

    let user = await User.findByPk(req.params.id)
    if (file) {
      imgur.setClientId(IMGUR_CLIENT_ID);
      let img = await imgur.uploadFile(file.path)
      await user.update({
        name: req.body.name,
        image: img.data.link
      })
    } else {
      await user.update({
        name: req.body.name,
        image: user.image
      })
    }
    return callback({ status: 'success', message: 'user profile was successfully update', user })  

    // User.findByPk(req.params.id)
    //   .then(user => {
    //     if (file) {
    //       imgur.setClientId(IMGUR_CLIENT_ID);
    //       imgur.uploadFile(file.path)
    //         .then((img) => {
    //           return user.update({
    //             name: req.body.name,
    //             image: img.data.link
    //           }).then((user) => {
    //             req.flash('success_messages', 'user profile was successfully update')
    //             return res.redirect(`/users/${req.params.id}`)
    //           })
    //         })
    //         .catch(err => console.log(err))
    //     } else {
    //       return user.update({
    //         name: req.body.name,
    //         image: user.image
    //       })
    //         .then((user) => {
    //           req.flash('success_messages', 'user profile was successfully update')
    //           return res.redirect(`/users/${req.params.id}`)
    //         })
    //         .catch(err => console.log(err))
    //     }
    //   })
  }, 
  addFavorite: (req, res, callback) => {
    return Favorite.create({
      UserId: req.user.id,
      RestaurantId: req.params.restaurantId
    })
      .then((restaurant) => {
        return callback({ status: 'success', message: '' })
      })
  },
  removeFavorite: (req, res, callback) => {
    return Favorite.findOne({
      where: {
        UserId: req.user.id,
        RestaurantId: req.params.restaurantId
      }
    })
      .then((favorite) => {
        favorite.destroy()
          .then((restaurant) => {
            return callback({ status: 'success', message: '' })
          })
      })
  },
  addLike: (req, res, callback) => {
    return Like.create({
      UserId: helpers.getUser(req).id,
      RestaurantId: req.params.restaurantId
    })
      .then((restaurant) => {
        return callback({ status: 'success', message: '' })
      })
  },
  deleteLike: (req, res, callback) => {
    return Like.findOne({
      where: {
        UserId: helpers.getUser(req).id,
        RestaurantId: req.params.restaurantId
      }
    })
      .then((like) => {
        like.destroy()
          .then((restaurant) => {
            return callback({ status: 'success', message: '' })
          })
      })
  },
  getTopUser: (req, res, callback) => {
    return User.findAll({
      include: [
        { model: User, as: 'Followers' }
      ]
    }).then(users => {
      // 整理 users 資料
      users = users.map(user => ({
        ...user.dataValues,
        // 新增 FollowerCount：計算追蹤者人數
        FollowerCount: user.Followers.length,
        // 判斷目前登入使用者是否已追蹤該 User
        // isFollowed: req.user.Followings.map(d => d.id).includes(user.id)
        isFollowed: req.user.Followings.some(d => d.id === user.id)
      }))
      // 依追蹤者人數排序
      users = users.sort((a, b) => b.FollowerCount - a.FollowerCount)
      return callback({ users })
    })
  },
  addFollowing: (req, res, callback) => {
    if (req.user.id === Number(req.params.userId)) {
      return callback({ status: 'error', message: '不能追蹤自己！' })      
    }
    return Followship.create({
      followerId: req.user.id,
      followingId: req.params.userId
    })
      .then((followship) => {
        return callback({ status: 'success', message: '' })
      })
  },
  removeFollowing: (req, res, callback) => {
    return Followship.findOne({
      where: {
        followerId: req.user.id,
        followingId: req.params.userId
      }
    })
      .then((followship) => {
        followship.destroy()
          .then((followship) => {
            return callback({ status: 'success', message: '' })
          })
      })
  }
}

module.exports = userService