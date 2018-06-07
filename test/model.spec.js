let odoose = require('../index')
let chai = require('chai')
let mocha = require('mocha')
let Odoo = require('odoo-xmlrpc')
let should = require('should')

var odoo = new Odoo({
  url: 'http://dev.la-recolte.net',
  db: 'ODOOSE',
  username: 'odoose',
  password: 'odoose'
})

var personSchema = new odoose.Schema({
  name: {
    type: String,
    path: 'name'
  },
  email: {
    type: String,
    path: 'email'
  }
})

var userSchema = new odoose.Schema({
  name: {
    type: String,
    path: 'name'
  },
  isActive: {
    type: Number,
    path: 'active'
  },
  person: {
    type: Object,
    ref: 'person',
    path: 'partner_id'
  }
})

odoose.connect(odoo, {})

var User = odoose.model('User', userSchema, 'res.users')

var models = {
  User: User
}

describe('#find() 1', function () {
  it('respond with matching records', function () {
    return User.find({}, 'name').should.eventually.have.length(2)
  })
})

describe('#find() 2', function () {
  it('respond with matching records', function (done) {
    User.find({}, 'name').then(res => {
      res.should.have.length(2)
      done()
    }).catch(err => {
      return done(err)
    })
  })
})

describe('#findById()', function () {
  it('respond with matching records', function (done) {
    User.findById(1, 'name').then(res => {
      res.should.be.a.instanceOf(Object).and.have.property('name').which.be.exactly('Administrator')
      done()
    }).catch(err => {
      return done(err)
    })
  })
})

describe('#populate()', function () {
  it('respond with matching records', function (done) {
    User.findById(1, 'name person').populate({ path: 'person', select: 'email' }).then(res => {
      res.should.be.a.instanceOf(Object).and.have.property('person').which.be.a.instanceOf(Object).and.have.property('email').which.be.exactly('admin@yourcompany.example.com')
      done()
    }).catch(err => {
      return done(err)
    })
  })
})
