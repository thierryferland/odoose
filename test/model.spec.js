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
  }],
  user: {
    type: Object,
    ref: 'User',
    path: 'user_id'
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

var companySchema = new odoose.Schema({
  name: {
    type: String,
    path: 'name'
  },
  person: {
    type: Object,
    ref: 'Person',
    path: 'partner_id'
  }
})

odoose.connect(odoo, {})

var User = odoose.model('User', userSchema, 'res.users')
var Person = odoose.model('Person', personSchema, 'res.partner')
var Product = odoose.model('Product', productSchema, 'product.product')
var Company = odoose.model('Company', companySchema, 'res.company')

var models = {
  User: User,
  Person: Person,
  Product: Product,
  Company: Company
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

describe('double #populate() with findById', function () {
  it('respond with matching records', function (done) {
    Company.findById(1, 'name person').populate({ path: 'person', select: 'name contacts' })
    .populate({ path: 'person.contacts', select: 'email name' }).then(res => {
      let person = { id: 40, name: 'Mark Davis', email: 'mark.davis@yourcompany.example.com' }
      res.should.be.a.instanceOf(Object).and.have.property('person').which.be.a.instanceOf(Object).and.have.property('contacts').which.be.a.instanceOf(Array).and.containEql(person)
      done()
    }).catch(err => {
      done(err)
    })
  })
})

describe('double #populate() with find()', function () {
  it('respond with matching records', function (done) {
    Company.find({}, 'name person').populate({ path: 'person', select: 'name contacts' })
    .populate({ path: 'person.contacts', select: 'email name' }).then(res => {
      let person = { id: 40, name: 'Mark Davis', email: 'mark.davis@yourcompany.example.com' }
      res.should.be.a.instanceOf(Array).and.have.length(2)
      res[1].should.be.a.instanceOf(Object).and.have.property('person').which.be.a.instanceOf(Object).and.have.property('contacts').which.be.a.instanceOf(Array).and.containEql(person)
      done()
    }).catch(err => {
      done(err)
    })
  })
})

describe('populate() with findbyId() for Person', function () {
  it('respond with matching records', function (done) {
    Person.findById(7, 'name contacts').populate({ path: 'contacts', select: 'name user' })
    .then(res => {
      res.should.be.a.instanceOf(Object).and.have.property('contacts').which.be.a.instanceOf(Array)
      done()
    }).catch(err => {
      done(err)
    })
  })
})

// Not working, to be done
describe('double #populate() with findbyId() many then one', function () {
  it('respond with matching records', function (done) {
    Person.findById(7, 'name contacts')
    .populate({ path: 'contacts', select: 'name user' })
    // .populate({ path: 'contacts.user', select: 'name' })
    .then(res => {
      let user = {id: 4, name: 'Demo User'}
      res.should.be.a.instanceOf(Object).and.have.property('contacts').which.be.a.instanceOf(Object)
      res.contacts[0].should.have.property('user').which.containEql(user)
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
      res.should.be.a.instanceOf(Array).and.have.length(9)
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

describe('#authenticate', function () {
  it('respond with matching records', function (done) {
    odoose.authenticate({'username': 'demo', 'password': 'demo'}).then(res => {
      console.log(res)
      res.should.equal(true)
      done()
    }).catch(err => {
      console.log(err)
      done(err)
    })
  })
})

describe('#authenticate incorrectly', function () {
  it('respond with matching records', function (done) {
    odoose.authenticate({'username': 'demo', 'password': 'demo2'}).then(res => {
      var err = Error('Identification was supposed to fail')
      done(err)
    }).catch(err => {
      err.should.be.instanceOf(Error)
      done()
    })
  })
})
