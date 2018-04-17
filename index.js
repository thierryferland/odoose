var Schema = require('./schema')
var Model = require('./model')

function Odoose () {
  this.connections = []
  this.models = {}
  this.modelSchemas = {}
}

Odoose.prototype.model = function (name, schema, collection, skipInit) {
  var model

  var connection = this.connections[0]
  model = this.Model.compile(model || name, schema, collection, connection, this)

  return model
}

Odoose.prototype.connect = function (db, options) {
  this.connections.push(db)
}

Odoose.prototype.Odoose = Odoose

Odoose.prototype.Schema = Schema

Odoose.prototype.Model = Model

var odoose = module.exports = exports = new Odoose()
