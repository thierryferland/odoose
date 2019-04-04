const OdoosePromise = require('./promise')
const Query = require('./query')
const objectPath = require('object-path')

function Model (doc, schema) {
  if (doc !== undefined && doc !== null) {
    Object.keys(doc).forEach((field) => {
      if (schema['obj'][field] !== undefined) {
        this[field] = doc[field]
      }
    })
  }
}

Model.find = function find (conditions, projection, options) {
  var selectedFields = projection.split(' ')
  var queryType = 'search_read'
  var that = this
  var func = function (resolve, reject) {
    try {
      that.db.connect(function (error, result) {
        if (error) {
          console.log(error)
          reject(error)
        }
        var query = new Query(that.db, that.schema, that.collectionName, conditions, selectedFields, queryType, that.opts)
        resolve(query.exec())
      })
    } catch (error) {
      reject(error)
    }
  }
  return new OdoosePromise(func, this)
}

Model.getSubDocument = function getSubDocument (update, schema) {
  let subDocuments = {}
  Object.keys(update).forEach((field) => {
    if (Array.isArray(schema['obj'][field]) && ('ref' in schema['obj'][field][0])) {
      subDocuments[field] = update[field]
    }
  })
  return subDocuments
}

Model.updateMany = function updateMany (update) {
  let promises = []
  Object.keys(update).forEach(key => {
    update[key].forEach(document => {
      let schema
      let referencedModelName = Array.isArray(this.schema.obj[key]) ? this.schema.obj[key][0]['ref'] : this.schema.obj[key]['ref']
      let collectionName = this.models.get(referencedModelName).collectionName
      schema = this.modelSchemas.get(referencedModelName)
      promises.push(this.updateOne(document['id'], document, schema, collectionName))
    })
  })
  return promises
}

Model.updateOne = function updateOne (id, update, schema, collectionName) {
  var queryType = 'write'
  var that = this
  let promises = []
  let subDocuments = this.getSubDocument(update, this.schema)
  if (schema === undefined) {
    schema = this.schema
  }
  if (collectionName === undefined) {
    collectionName = this.collectionName
  }
  var func = function (resolve, reject) {
    try {
      that.db.connect(function (error, result) {
        if (error) {
          console.log(error)
          reject(error)
        }
        var query = new Query(that.db, schema, collectionName, id, null, queryType, that.opts)
        resolve(query.save(update))
      })
    } catch (error) {
      reject(error)
    }
  }
  promises.push(new Promise(func))
  if (subDocuments !== {}) {
    promises.concat(this.updateMany(subDocuments))
  }
  return Promise.all(promises, this)
}

Model.createOne = function createOne (doc) {
  var queryType = 'create'
  var that = this
  let func = function (resolve, reject) {
    try {
      that.db.connect(function (error, result) {
        if (error) {
          console.log(error)
          reject(error)
        }
        let query = new Query(that.db, that.schema, that.collectionName, null, null, queryType, that.opts)
        resolve(query.create(doc))
      })
    } catch (error) {
      reject(error)
    }
  }
  return new Promise(func)
}

Model.deleteOne = function deleteOne (conditions) {
  let that = this
  let queryType = 'unlink'
  let func = function (resolve, reject) {
    try {
      that.db.connect(function (error, result) {
        if (error) {
          console.log(error)
          reject(error)
        }
        let query = new Query(that.db, that.schema, that.collectionName, [conditions['id']], null, queryType, that.opts)
        resolve(query.delete(conditions['id']))
      })
    } catch (error) {
      reject(error)
    }
  }
  return new Promise(func)
}

Model.deleteMany = function deleteMany (conditions) {
  let that = this
  let queryType = 'unlink'
  let func = function (resolve, reject) {
    try {
      that.db.connect(function (error, result) {
        if (error) {
          console.log(error)
          reject(error)
        }
        let query = new Query(that.db, that.schema, that.collectionName, [conditions['id']], null, queryType, that.opts)
        resolve(query.delete(conditions['id']))
      })
    } catch (error) {
      reject(error)
    }
  }
  return new Promise(func)
}

Model.findById = function findById (id, projection, options) {
  var selectedFields = projection.split(' ')
  var queryType = 'read'
  var that = this
  var func = function (resolve, reject) {
    try {
      that.db.connect(function (error, result) {
        if (error) {
          console.log(error)
          reject(error)
        }
        var query = new Query(that.db, that.schema, that.collectionName, id, selectedFields, queryType, that.opts)
        resolve(query.exec())
      })
    } catch (error) {
      reject(error)
    }
  }
  return new OdoosePromise(func, this)
}

Model.populate = function populate (options, results) {
  const queryType = 'read'
  var selectedFields = options['select'].split(' ')
  let path = options['path']
  let paths = options['path'].split('.')

  let isManyReferenced = Array.isArray(this.schema.obj[paths[0]])
  let isEmbeddedPopulate = paths.length > 1
  let isManyReferencing = Array.isArray(results)

  let referencedModelName

  var schema
  isManyReferenced ? referencedModelName = this.schema.obj[paths[0]][0]['ref'] : referencedModelName = this.schema.obj[paths[0]]['ref']
  schema = this.modelSchemas.get(referencedModelName)
  if (isEmbeddedPopulate) {
    referencedModelName = Array.isArray(schema.obj[paths[1]]) ? schema.obj[paths[1]][0]['ref'] : schema.obj[paths[1]]['ref']
    schema = this.modelSchemas.get(referencedModelName)
  }
  var collectionName = this.models.get(referencedModelName).collectionName
  // let promises = []
  if (!isManyReferencing) {
    let id = objectPath.get(results, path)
    if (!Array.isArray(id) & typeof id === 'object') {
      id = id['id']
    }
    let query = new Query(this.db, schema, collectionName, id, selectedFields, queryType, this.opts)
    let func = function (resolve, reject) {
      try {
        query.exec().then(populateResult => {
          objectPath.set(results, path, populateResult)
          resolve(results)
        })
      } catch (error) {
        reject(error)
      }
    }
    return new OdoosePromise(func, this)
  } else {
    let ids = []
    results.forEach(result => {
      let id = objectPath.get(result, path)
      if (!Array.isArray(id) & typeof id === 'object') {
        ids.push(id['id'])
      } else {
        ids = ids.concat(id)
      }
    })
    let idsUnique = [...new Set(ids)]
    let query = new Query(this.db, schema, collectionName, idsUnique, selectedFields, queryType, this.opts)
    let func = function (resolve, reject) {
      try {
        query.exec().then(populateResults => {
          let populateResultsMap = new Map()
          populateResults.forEach(populateResult => {
            populateResultsMap.set(populateResult['id'], populateResult)
          })
          results.forEach(result => {
            let ids = objectPath.get(result, path)
            if (!Array.isArray(ids) & typeof ids === 'object') {
              objectPath.set(result, path, populateResultsMap.get(ids['id']))
            } else {
              objectPath.set(result, path, populateResultsMap.get(objectPath.get(result, path)['id']))
              let populatedIds = []
              ids.forEach(id => {
                populatedIds.push(populateResultsMap.get(id))
              })
              objectPath.set(result, path, populatedIds)
            }
          })
          resolve(results)
        })
      } catch (error) {
        reject(error)
      }
    }
    // promises.push(new OdoosePromise(func, this))

    return new OdoosePromise(func, this)
  }
}

Model.compile = function compile (name, schema, collectionName, connection, base) {
  let model
  model = function model (doc, fields, skipId) {
    // return new this.Model(doc)
    Model.call(this, doc, schema)
  }
  model.modelName = name
  model.db = connection
  model.schema = schema
  model.collectionName = collectionName
  model.modelSchemas = base.modelSchemas
  model.models = base.models
  model.opts = base.opts
  model.find = this.find
  model.findById = this.findById
  model.populate = this.populate
  model.updateOne = this.updateOne
  model.createOne = this.createOne
  model.deleteOne = this.deleteOne
  model.getSubDocument = this.getSubDocument
  model.updateMany = this.updateMany
  model.prototype.save = this.save
  model.prototype.getModel = () => { return model }
  return model
}

Model.save = function save () {
  let model = this.getModel()
  let doc = this
  if ('id' in this) {
    return model.updateOne(doc['id'], doc)
  } else {
    return model.createOne(doc)
  }
}

module.exports = Model
