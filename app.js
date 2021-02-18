const express = require('express')
const handlebars = require('express-handlebars')
const flash = require('connect-flash')
const session = require('express-session')
const methodOverride = require('method-override')
const helpers = require('./_helpers')

const app = express()
const port = process.env.PORT || 3000

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}
const passport = require('./config/passport')

app.engine('handlebars', handlebars({ helpers: require('./config/handlebars-helpers') }))
app.set('view engine', 'handlebars')
app.use(express.urlencoded({ extended: true })) // body-parser
app.use(express.json())
app.use(session({
  secret: 'secret',
  resave: false,
  saveUninitialized: false
}))
app.use(passport.initialize())
app.use(passport.session())
app.use(flash())
app.use(methodOverride('_method'))
app.use('/upload', express.static(__dirname + '/upload'))

app.use((req, res, next) => {
  res.locals.success_messages = req.flash('success_messages')
  res.locals.error_messages = req.flash('error_messages')
  // res.locals.user = req.user
  res.locals.user = helpers.getUser(req)
  next()
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

require('./routes')(app)

module.exports = app
