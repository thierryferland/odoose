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
  id: {
    type: Number,
    path: 'id'
  },
  name: {
    type: String,
    path: 'name'
  },
  email: {
    type: String,
    path: 'email'
  },
  phone: {
    type: String,
    path: 'phone'
  },
  contacts: [{
    type: Object,
    ref: 'Person',
    path: 'child_ids'
  }]
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
    ref: 'Person',
    path: 'partner_id'
  }
})

var productSchema = new odoose.Schema({
  name: {
    type: String,
    path: 'name'
  }
})

odoose.connect(odoo, {})

var User = odoose.model('User', userSchema, 'res.users')
var Person = odoose.model('Person', personSchema, 'res.partner')
var Product = odoose.model('Product', productSchema, 'product.product')

var models = {
  User: User,
  Person: Person,
  Product: Product
}

describe('#find() 1', function () {
  it('respond with matching records', function () {
    return User.find({}, 'name').should.eventually.have.length(3)
  })
})

describe('#find() 2', function () {
  it('respond with matching records', function (done) {
    User.find({}, 'name').then(res => {
      res.should.have.length(3)
      done()
    }).catch(err => {
      done(err)
    })
  })
})

describe('#findById() user', function () {
  it('respond with matching records', function (done) {
    User.findById(1, 'name').then(res => {
      res.should.be.a.instanceOf(Object).and.have.property('name').which.be.exactly('Administrator')
      done()
    }).catch(err => {
      done(err)
    })
  })
})

describe('Return empty fields as empty rather than False', function () {
  it('respond with matching records', function (done) {
    Person.find({name: 'Administrator'}, 'phone').then(res => {
      res[0].should.be.a.instanceOf(Object).and.have.property('phone').which.be.exactly(undefined)
      done()
    }).catch(err => {
      done(err)
    })
  })
})

describe('#findById() person', function () {
  it('respond with matching records', function (done) {
    Person.findById(1, 'email').then(res => {
      res.should.be.a.instanceOf(Object).and.have.property('email').which.be.exactly('info@yourcompany.example.com')
      done()
    }).catch(err => {
      done(err)
    })
  })
})

describe('#populate()', function () {
  it('respond with matching records', function (done) {
    User.findById(1, 'name person').populate({ path: 'person', select: 'email name' }).then(res => {
      res.should.be.a.instanceOf(Object).and.have.property('person').which.be.a.instanceOf(Object).and.have.property('email').which.be.exactly('admin@yourcompany.example.com')
      done()
    }).catch(err => {
      done(err)
    })
  })
})

describe('Find document with a field containe an array of referenced id', function () {
  it('respond with matching records', function (done) {
    Person.find({'id': {$in: [1, 3, 5, 6, 7]}}, 'name contacts id').then(res => {
      res.should.be.a.instanceOf(Array).and.have.length(5)
      done()
    }).catch(err => {
      done(err)
    })
  })
})

describe('#populate() for arrays', function () {
  it('respond with matching records', function (done) {
    Person.findById(7, 'name contacts').populate({ path: 'contacts', select: 'email name' }).then(res => {
      res.should.be.a.instanceOf(Object).and.have.property('contacts').which.be.a.instanceOf(Array).which.containEql({'id': 17, 'name': 'Edward Foster', 'email': 'efoster@seagate.com'})
      done()
    }).catch(err => {
      done(err)
    })
  })
})

describe('#populate() for find', function () {
  it('respond with matching records', function (done) {
    Person.find({'id': {$in: [1, 3, 5, 6, 7]}}, 'name contacts').populate({ path: 'contacts', select: 'email name' }).then(res => {
      res.should.be.a.instanceOf(Array).and.have.length(5)
      res[1].should.be.a.instanceOf(Object).and.have.property('contacts').which.be.a.instanceOf(Array).which.containEql({'id': 17, 'name': 'Edward Foster', 'email': 'efoster@seagate.com'})
      done()
    }).catch(err => {
      done(err)
    })
  })
})

describe('Find greater than or equal', function () {
  it('respond with matching records', function (done) {
    Person.find({'id': {$gte: 36}}, 'name contacts id').then(res => {
      res.should.be.a.instanceOf(Array).and.have.length(8)
      done()
    }).catch(err => {
      done(err)
    })
  })
})

describe('Find lower than or equal', function () {
  it('respond with matching records', function (done) {
    Person.find({'id': {$lte: 7}}, 'name contacts id').then(res => {
      res.should.be.a.instanceOf(Array).and.have.length(5)
      done()
    }).catch(err => {
      done(err)
    })
  })
})

describe('Find lower than', function () {
  it('respond with matching records', function (done) {
    Person.find({'id': {$lt: 7}}, 'name contacts id').then(res => {
      res.should.be.a.instanceOf(Array).and.have.length(4)
      done()
    }).catch(err => {
      done(err)
    })
  })
})
