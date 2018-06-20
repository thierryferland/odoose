var Schema = require('./schema')
var Model = require('./model')

class Odoose {
  constructor () {
    this.connections = []
    this.models = new Map()
    this.modelSchemas = new Map()
    this.Schema = Schema
    this.Model = Model
  }

  model (name, schema, collection, skipInit) {
    var connection = this.connections[0]
    var model = new Model(name, schema, collection, connection, this)
    this.modelSchemas.set(name, schema)
    this.models.set(name, model)
    return model
  }

  connect (db, options) {
    this.connections.push(db)
  }
}

module.exports = new Odoose()
