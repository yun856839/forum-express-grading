const express = require('express')
const router = express.Router()
const multer = require('multer')
const upload = multer({ dest: 'temp/' })
const adminController = require('../controllers/api/adminController.js')
const categoryController = require('../controllers/api/categoryController.js')
const userController = require('../controllers/api/userController.js')
const restController = require('../controllers/api/restController.js')
const commentController = require('../controllers/api/commentController.js')
const passport = require('../config/passport')

const authenticated = passport.authenticate('jwt', { session: false })

const authenticatedAdmin = (req, res, next) => {
  if (req.user) {
    if (req.user.isAdmin) { return next() }
    return res.json({ status: 'error', message: 'permission denied' })
  } else {
    return res.json({ status: 'error', message: 'permission denied' })
  }
}

router.get('/', authenticated, (req, res) => res.redirect('/api/restaurants'))
router.get('/restaurants', authenticated, restController.getRestaurants)
router.get('/restaurants/top', authenticated, restController.getTopRestaurants)
router.get('/restaurants/feeds', authenticated, restController.getFeeds)
router.get('/restaurants/:id', authenticated, restController.getRestaurant)
router.get('/restaurants/:id/dashboard', authenticated, restController.getDashboard)

router.get('/users/top', authenticated, userController.getTopUser)
router.get('/users/:id', authenticated, userController.getUser)
router.get('/users/:id/edit', authenticated, userController.editUser)
router.put('/users/:id', authenticated, upload.single('image'), userController.putUser)
router.post('/favorite/:restaurantId', authenticated, userController.addFavorite)
router.delete('/favorite/:restaurantId', authenticated, userController.removeFavorite)
router.post('/like/:restaurantId', authenticated, userController.addLike)
router.delete('/like/:restaurantId', authenticated, userController.deleteLike)
router.post('/following/:userId', authenticated, userController.addFollowing)
router.delete('/following/:userId', authenticated, userController.removeFollowing)

router.post('/comments', authenticated, commentController.postComment)
router.delete('/comments/:id', authenticatedAdmin, commentController.deleteComment)

router.get('/admin', authenticated, authenticatedAdmin, (req, res) => res.redirect('/api/admin/restaurants'))
router.get('/admin/restaurants', authenticated, authenticatedAdmin, adminController.getRestaurants)
router.get('/admin/restaurants/:id', authenticated, authenticatedAdmin, adminController.getRestaurant)
router.post('/admin/restaurants', authenticated, authenticatedAdmin, upload.single('image'), adminController.postRestaurant)
router.put('/admin/restaurants/:id', authenticated, authenticatedAdmin, upload.single('image'), adminController.putRestaurant)
router.delete('/admin/restaurants/:id', authenticated, authenticatedAdmin, adminController.deleteRestaurant)

router.get('/admin/users', authenticated, authenticatedAdmin, adminController.getUsers)
router.put('/admin/users/:id', authenticated, authenticatedAdmin, adminController.toggleAdmin)

router.get('/admin/categories', authenticated, authenticatedAdmin, categoryController.getCategories)
router.post('/admin/categories', authenticated, authenticatedAdmin, categoryController.postCategory)
router.put('/admin/categories/:id', authenticated, authenticatedAdmin, categoryController.putCategory)
router.delete('/admin/categories/:id', authenticated, authenticatedAdmin, categoryController.deleteCategory)

router.post('/signin', userController.signIn)
router.post('/signup', userController.signUp)

module.exports = router