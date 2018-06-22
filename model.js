const OdoosePromise = require('./promise')
const Query = require('./query')

class Model {
  constructor (name, schema, collectionName, connection, base) {
    this.modelName = name
    // this.model = Model.prototype.model
    this.db = connection
    this.schema = schema
    this.collectionName = collectionName
    this.modelSchemas = base.modelSchemas
    this.models = base.models
  }

  find (conditions, projection, options) {
    var selectedFields = projection.split(' ')
    var queryType = 'search_read'
    var query = new Query(this.db, this.schema, this.collectionName, conditions, selectedFields, queryType, this)
    return query.exec()
  }

  findById (id, projection, options) {
    var selectedFields = projection.split(' ')
    var queryType = 'read'
    var query = new Query(this.db, this.schema, this.collectionName, id, selectedFields, queryType, this)
    return query.exec()
  }

  populate (options, results) {
    const queryType = 'read'
    var selectedFields = options['select'].split(' ')
    let paths = options['path'].split('.')

    let isManyReferenced = Array.isArray(this.schema.obj[options['path']])
    let isManyReferencing = Array.isArray(results)
    let isEmbeddedPopulate = paths.length > 1

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
      let id = isEmbeddedPopulate ? results[paths[0]][paths[1]] : results[paths[0]]

      let query = new Query(this.db, schema, collectionName, id, selectedFields, queryType, this)
      let func = function (resolve, reject) {
        try {
          query.exec().then(populateResult => {
            isEmbeddedPopulate ? results[paths[0]][paths[1]] = populateResult : results[paths[0]] = populateResult
            resolve(results)
          })
        } catch (error) {
          reject(error)
        }
      }
      return new OdoosePromise(func, this)
    } else {
      results.forEach(result => {
        let id = isEmbeddedPopulate ? result[paths[0]][paths[1]] : result[paths[0]]
        let query = new Query(this.db, schema, collectionName, id, selectedFields, queryType, this)
        let func = function (resolve, reject) {
          try {
            query.exec().then(populateResult => {
              isEmbeddedPopulate ? result[paths[0]][paths[1]] = populateResult : result[paths[0]] = populateResult
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
