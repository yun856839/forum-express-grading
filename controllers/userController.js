const bcrypt = require('bcryptjs')
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

const userController = {
  // 瀏覽 Profile
  getUser: (req, res) => {
    return User.findByPk(req.params.id, {
      include: [
        { model: Restaurant, as: 'FavoritedRestaurants' },
        { model: User, as: 'Followers' },
        { model: User, as: 'Followings' },
        { model: Comment, include: [Restaurant] }
      ]
    }).then(user => {
      if (!user) {
        req.flash('error_messages', 'user doesn\'t exist')
        return res.redirect('/restaurants')
      }

      const commentedRests = user.toJSON().Comments.map(comment => ({ ...comment.Restaurant }))

      const set = new Set();
      const noRepeatCommentRests = commentedRests.filter(item => !set.has(item.id) ? set.add(item.id) : false);
      const isFollowed = helpers.getUser(req).Followings.some(d => d.id === user.id)
      // const isFollowed = helpers.getUser(req).Followings.map(d => d.id).includes(user.id)

      return res.render('profile', {
        profile: user.toJSON(),
        noRepeatCommentRests,
        isFollowed
      })
    })
  },

  // 瀏覽編輯 Profile 頁面
  editUser: (req, res) => {
    return User.findByPk(req.params.id).then(user => res.render('editProfile', { profile: user.toJSON() }))
  },

  // 編輯 Profile
  putUser: (req, res) => {
    if (!req.body.name) {
      req.flash('error_messages', 'name didn\'t exist')
      return res.redirect('back')
    }

    const { file } = req

    // async function putUser() {
    //   let user = await User.findByPk(req.params.id)
    //   if (file) {
    //     imgur.setClientId(IMGUR_CLIENT_ID);
    //     let img = await imgur.uploadFile(file.path)
    //     await user.update({
    //       name: req.body.name,
    //       image: img.data.link
    //     })
    //   } else {
    //     await user.update({
    //       name: req.body.name,
    //       image: user.image
    //     })
    //   }
    //   req.flash('success_messages', 'user profile was successfully update')
    //   return res.redirect(`/users/${req.params.id}`)
    // }
    // putUser()

    User.findByPk(req.params.id)
      .then(user => {
        if (file) {
          imgur.setClientId(IMGUR_CLIENT_ID);
          imgur.uploadFile(file.path)
            .then((img) => {
              return user.update({
                name: req.body.name,
                image: img.data.link
              }).then((user) => {
                req.flash('success_messages', 'user profile was successfully update')
                return res.redirect(`/users/${req.params.id}`)
              })
            })
            .catch(err => console.log(err))
        } else {
          return user.update({
            name: req.body.name,
            image: user.image
          })
            .then((user) => {
              req.flash('success_messages', 'user profile was successfully update')
              return res.redirect(`/users/${req.params.id}`)
            })
            .catch(err => console.log(err))
        }
      })
  },

  // 註冊的頁面
  signUpPage: (req, res) => {
    return res.render('signup')
  },

  // 註冊的行為
  signUp: (req, res) => {
    // 兩次確認密碼
    if (req.body.passwordCheck !== req.body.password) {
      req.flash('error_messages', '兩次密碼輸入不同！')
      return res.redirect('/signup')
    } else {
      // 已經註冊
      User.findOne({ where: { email: req.body.email } }).then(user => {
        if (user) {
          req.flash('error_messages', '信箱重複！')
          return res.redirect('/signup')
        } else {
          User.create({
            name: req.body.name,
            email: req.body.email,
            password: bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(10), null)
          }).then(user => {
            req.flash('success_messages', '成功註冊帳號！')
            return res.redirect('/signin')
          })
        }
      })
    }
  },

  signInPage: (req, res) => {
    return res.render('signin')
  },

  signIn: (req, res) => {
    req.flash('success_messages', '成功登入！')
    res.redirect('/restaurants')
  },

  logout: (req, res) => {
    req.flash('success_messages', '登出成功！')
    req.logout()
    res.redirect('/signin')
  },

  addFavorite: (req, res) => {
    return Favorite.create({
      UserId: req.user.id,
      RestaurantId: req.params.restaurantId
    })
      .then((restaurant) => {
        return res.redirect('back')
      })
  },
  removeFavorite: (req, res) => {
    return Favorite.findOne({
      where: {
        UserId: req.user.id,
        RestaurantId: req.params.restaurantId
      }
    })
      .then((favorite) => {
        favorite.destroy()
          .then((restaurant) => {
            return res.redirect('back')
          })
      })
  },

  addLike: (req, res) => {
    return Like.create({
      UserId: helpers.getUser(req).id,
      RestaurantId: req.params.restaurantId
    })
      .then((restaurant) => {
        return res.redirect('back')
      })
  },

  deleteLike: (req, res) => {
    return Like.findOne({
      where: {
        UserId: helpers.getUser(req).id,
        RestaurantId: req.params.restaurantId
      }
    })
      .then((like) => {
        like.destroy()
          .then((restaurant) => {
            return res.redirect('back')
          })
      })
  },

  getTopUser: (req, res) => {
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
      return res.render('topUser', { users: users })
    })
  },

  addFollowing: (req, res) => {
    if (req.user.id === Number(req.params.userId)) {
      req.flash('error_messages', '不能追蹤自己！')
      return res.redirect('/users/top')
    }
    return Followship.create({
      followerId: req.user.id,
      followingId: req.params.userId
    })
      .then((followship) => {
        return res.redirect('back')
      })
  },

  removeFollowing: (req, res) => {
    return Followship.findOne({
      where: {
        followerId: req.user.id,
        followingId: req.params.userId
      }
    })
      .then((followship) => {
        followship.destroy()
          .then((followship) => {
            return res.redirect('back')
          })
      })
  }

}

module.exports = userController
