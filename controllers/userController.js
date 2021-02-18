const bcrypt = require('bcryptjs')
const db = require('../models')
const User = db.User
const userService = require('../services/userService.js')

const userController = {
  // 瀏覽 Profile
  getUser: (req, res) => {
    userService.getUser(req, res, (data) => {
      if (data['status'] === 'error') {
        req.flash('error_messages', data['message'])
        return res.redirect('/restaurants')
      }
      return res.render('profile', data)
    })    
  },
  // 瀏覽編輯 Profile 頁面
  editUser: (req, res) => {
    userService.editUser(req, res, (data) => {
      res.render('editProfile', data)
    })    
  },
  // 編輯 Profile
  putUser: (req, res) => {
    userService.putUser(req, res, (data) => {
      if (data['status'] === 'error') {
        req.flash('error_messages', data['message'])
        return res.redirect('back')
      }
      req.flash('success_messages', data['message'])
      return res.redirect(`/users/${data.user.id}`)
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
    userService.addFavorite(req, res, (data) => {
      return res.redirect('back')
    })    
  },
  removeFavorite: (req, res) => {
    userService.removeFavorite(req, res, (data) => {
      return res.redirect('back')
    })       
  },
  addLike: (req, res) => {
    userService.addLike(req, res, (data) => {
      return res.redirect('back')
    })    
  },
  deleteLike: (req, res) => {
    userService.deleteLike(req, res, (data) => {
      return res.redirect('back')
    })  
  },
  getTopUser: (req, res) => {
    userService.getTopUser(req, res, (data) => {
      return res.render('topUser', data)
    })    
  },
  addFollowing: (req, res) => {
    userService.addFollowing(req, res, (data) => {
       if (data['status'] === 'error') {
        req.flash('error_messages', data['message'])
        return res.redirect('/users/top')
      }
      return res.redirect('back')
    })    
  },
  removeFollowing: (req, res) => {
    userService.removeFollowing(req, res, (data) => {
      return res.redirect('back')
    })    
  }
}

module.exports = userController
