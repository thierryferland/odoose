
var Query = require('./query')
// Shit implementation

function Model (doc, fields, skipId) {
  // var model = doc
  // return model
}

Model.compile = function (name, schema, collectionName, connection, base) {
  var model
  model = new Model()
  // Bad, to to be changed
  model.findById = this.findById
  model.find = this.find
  model.populate = this.populate
  model.modelName = name
  model.model = Model.prototype.model
  model.db = connection

  model.schema = schema
  // model.collection = model.prototype.collection
  model.collectionName = collectionName
  return model
}

Model.find = function (conditions, projection, options) {
  var selectedFields = projection.split(' ')
  var queryType = 'search_read'
  var query = new Query(this.db, this.schema, this.collectionName, conditions, selectedFields, queryType)
  return query.exec()
}

Model.findById = function (id, projection, options) {
  var selectedFields = projection.split(' ')
  var queryType = 'read'
  var query = new Query(this.db, this.schema, this.collectionName, id, selectedFields, queryType)
  return query.exec()
}

module.exports = exports = Model
