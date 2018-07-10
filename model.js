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
          var query = new Query(that.db, that.schema, that.collectionName, conditions, selectedFields, queryType)
          resolve(query.exec())
        })
      } catch (error) {
        reject(error)
      }
    }
    return new OdoosePromise(func, this)
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
          var query = new Query(that.db, that.schema, that.collectionName, id, selectedFields, queryType)
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
      let query = new Query(this.db, schema, collectionName, id, selectedFields, queryType)
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
        let query = new Query(this.db, schema, collectionName, id, selectedFields, queryType)
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
