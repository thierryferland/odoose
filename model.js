var Query = require('./query')

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

    let isManyReferenced = Array.isArray(this.schema.obj[options['path']])
    let isManyReferencing = Array.isArray(results)

    let referencedModel
    if (isManyReferenced) {
      referencedModel = this.schema.obj[options['path']][0]['ref']
    } else {
      referencedModel = this.schema.obj[options['path']]['ref']
    }

    var collectionName = this.models.get(referencedModel).collectionName
    var schema = this.modelSchemas.get(referencedModel)
    let promises = []
    if (!isManyReferencing) {
      let id = results[options['path']]
      let query = new Query(this.db, schema, collectionName, id, selectedFields, queryType, this)
      let func = function (resolve, reject) {
        try {
          query.exec().then(populateResult => {
            results[options['path']] = populateResult
            resolve(results)
          })
        } catch (error) {
          reject(error)
        }
      }
      return new Promise(func)
    } else {
      results.forEach(result => {
        let id = result[options['path']]
        let query = new Query(this.db, schema, collectionName, id, selectedFields, queryType, this)
        let func = function (resolve, reject) {
          try {
            query.exec().then(populateResult => {
              result[options['path']] = populateResult
              resolve(result)
            })
          } catch (error) {
            reject(error)
          }
        }
        promises.push(new Promise(func))
      })
      return Promise.all(promises)
    }
  }
}

module.exports = Model
