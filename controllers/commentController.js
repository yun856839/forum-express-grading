const db = require('../models')
const Comment = db.Comment

const commentController = {
  postComment: (req, res) => {
    if (req.body.text.length > 100) {
      req.flash('error_messages', 'Comment too large')
      return res.redirect('back')
    }
    return Comment.create({
      text: req.body.text,
      RestaurantId: req.body.restaurantId,
      UserId: req.user.id
    }).then(comment => res.redirect(`/restaurants/${req.body.restaurantId}`))
  },

  deleteComment: (req, res) => {
    return Comment.findByPk(req.params.id)
      .then((comment) => {
        comment.destroy()
          .then((comment) => {
            res.redirect(`/restaurants/${comment.RestaurantId}`)
          })
      })
  }
}

module.exports = commentController