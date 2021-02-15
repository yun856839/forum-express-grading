const bcrypt = require('bcryptjs')
const db = require('../models')
const Restaurant = db.Restaurant
const Comment = db.Comment
const User = db.User
const Favorite = db.Favorite
const fs = require('fs')
const imgur = require('imgur')
const IMGUR_CLIENT_ID = process.env.IMGUR_CLIENT_ID

const userController = {
  // 瀏覽 Profile
  getUser: (req, res) => {
    return User.findByPk(req.params.id, {
      include: [
        { model: Comment, include: [Restaurant] }
      ]
    }).then(user => {
      if (!user) {
        req.flash('error_messages', 'user doesn\'t exist')
        return res.redirect('/restaurants')
      }
      return res.render('profile', {
        profile: user.toJSON()
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
    if (file) {
      imgur.setClientId(IMGUR_CLIENT_ID);
      imgur.uploadFile(file.path)
        .then(img => {
          return User.findByPk(req.params.id)
            .then(user => {
              return user.update({
                name: req.body.name,
                image: img.data.link
              })
                .then((user) => {
                  req.flash('success_messages', 'user profile was successfully update')
                  return res.redirect(`/users/${req.params.id}`)
                })
            })
        })
        .catch(err => console.log(err))
    } else {
      return User.findByPk(req.params.id)
        .then(user => {
          return user.update({
            name: req.body.name,
            image: user.image
          })
            .then((user) => {
              req.flash('success_messages', 'user profile was successfully update')
              return res.redirect(`/users/${req.params.id}`)
            })
        })
        .catch(err => console.log(err))
    }
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
  }
}

module.exports = userController
