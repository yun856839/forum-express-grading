const db = require('../models')
const Category = db.Category

let categoryService = {
  getCategories: (req, res, callback) => {
    return Category.findAll({
      raw: true,
      nest: true
    }).then(categories => {
      if (req.params.id) {
        Category.findByPk(req.params.id)
          .then((category) => {
            return res.render('admin/categories', { category: category.toJSON(), categories })
          })
      } else {
        callback({ categories })
      }
    })
  },
  postCategory: (req, res, callback) => {
    if (!req.body.name.trim()) {
      callback({ status: 'error', message: 'name didn\'t exist' })      
    } else {
      return Category.create({
        name: req.body.name
      }).then((category) => { 
        callback({ status: 'success', message: 'category was successfully created' })
      })
    }
  },
  putCategory: (req, res, callback) => {
    if (!req.body.name.trim()) {
      callback({ status: 'error', message: 'name didn\'t exist' })       
    } else {
      return Category.findByPk(req.params.id)
        .then((category) => {
          category.update(req.body)
            .then((category) => {
              callback({ status: 'success', message: 'category was successfully created' })
            })
        })
    }
  },
  deleteCategory: (req, res, callback) => {
    return Category.findByPk(req.params.id)
      .then((category) => {
        category.destroy()
          .then((category) => {
            callback({ status: 'success', message: ''})            
          })
      })
  }
}

module.exports = categoryService