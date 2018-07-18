const OdoosePromise = require('./promise')
const Query = require('./query')
const objectPath = require('object-path')

class Model {
  constructor (name, schema, collectionName, connection, base) {
    this.modelName = name
    this.db = connection
    this.schema = schema
    this.collectionName = collectionName
    this.modelSchemas = base.modelSchemas
    this.models = base.models
    this.opts = base.opts
  }

  find (conditions, projection, options) {
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

  getSubDocument (update, schema) {
    let subDocuments = {}
    Object.keys(update).forEach((field) => {
      if (Array.isArray(schema['obj'][field]) && ('ref' in schema['obj'][field][0])) {
        subDocuments[field] = update[field]
      }
    })
    return subDocuments
  }

  updateMany (update) {
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

  updateOne (id, update, schema, collectionName) {
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

  findById (id, projection, options) {
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

  populate (options, results) {
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
    let promises = []
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
      results.forEach(result => {
        let id = objectPath.get(result, path)
        if (!Array.isArray(id) & typeof id === 'object') {
          id = id['id']
        }
        let query = new Query(this.db, schema, collectionName, id, selectedFields, queryType, this.opts)
        let func = function (resolve, reject) {
          try {
            query.exec().then(populateResult => {
              objectPath.set(result, path, populateResult)
              resolve(result)
            })
          } catch (error) {
            reject(error)
          }
        }
        promises.push(new OdoosePromise(func, this))
      })
      return OdoosePromise.all(promises, this)
    }
  }
}

module.exports = Model
