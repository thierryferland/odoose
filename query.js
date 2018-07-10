var OdooPromise = require('./promise')

class Query {
  constructor (db, schema, collection, conditions, projection, queryType, model) {
    this.conditions = conditions
    this.db = db
    this.schema = schema
    this.collection = collection
    this.queryType = queryType
    this.model = model
    this.projection = projection
  }

  setParams (conditions, projection, schema) {
    return new Promise(
      function (resolve, reject) {
        try {
          var domain
          if (!Array.isArray(conditions) & typeof conditions === 'object') {
            domain = [[]]
            Object.keys(conditions).forEach((key) => {
              if (schema['obj'][key] !== undefined) {
                let operator = '='
                let condition = conditions[key]
                if (typeof conditions[key] === 'object') {
                  Object.keys(conditions[key]).forEach((conditionKey) => {
                    switch (conditionKey) {
                      case '$in':
                        operator = 'in'
                        condition = conditions[key][conditionKey]
                        break
                      case '$lt':
                        operator = '<'
                        condition = conditions[key][conditionKey]
                        break
                      case '$gt':
                        operator = '>'
                        condition = conditions[key][conditionKey]
                        break
                      case '$eq':
                        operator = '='
                        condition = conditions[key][conditionKey]
                        break
                      case '$gte':
                        operator = '>='
                        condition = conditions[key][conditionKey]
                        break
                      case '$lte':
                        operator = '<='
                        condition = conditions[key][conditionKey]
                        break
                      case '$ne':
                        operator = '!='
                        condition = conditions[key][conditionKey]
                        break
                      case '$nin':
                        operator = 'not in'
                        condition = conditions[key][conditionKey]
                        break
                      default:
                        let error = Error('The operator is not recognized')
                        reject(error)
                    }
                    domain[0].push([schema['obj'][key].path, operator, condition])
                  })
                } else {
                  domain[0].push([schema['obj'][key].path, operator, condition])
                }
              }
            })
          } else {
            domain = [conditions]
          }

          var options = {fields: []}
          if (projection === undefined) {
            projection = Object.keys(schema['obj'])
          }
          projection.forEach((key) => {
            let field
            if (schema['obj'][key] !== undefined) {
              if (Array.isArray(schema['obj'][key])) {
                field = schema['obj'][key][0].path
              } else {
                field = schema['obj'][key].path
              }
              if (field !== undefined) {
                options.fields.push(field)
              }
            }
          })
          var params = [domain, options]
          resolve(params)
        } catch (error) {
          reject(error)
        }
      })
  }

  adapt (results, schema) {
    return new Promise(
      function (resolve, reject) {
        try {
          var adaptedResults = []
          var isSingleResult = !Array.isArray(results)
          if (isSingleResult) {
            results = [results]
          }
          results.forEach((result) => {
            var adaptedResult = {}
            Object.keys(schema['obj']).forEach((key) => {
              var path
              if (schema['obj'][key] !== undefined) {
                if (Array.isArray(schema['obj'][key])) {
                  path = schema['obj'][key][0].path
                } else {
                  path = schema['obj'][key].path
                }
              }
              if (path !== undefined & result[path] !== undefined) {
                if (schema['obj'][key].data !== undefined) {
                  adaptedResult[key] = { data: Buffer.from(result[path], 'base64'), contentType: 'image/jpeg' }
                } else if (!Array.isArray(schema['obj'][key]) & Array.isArray(result[path])) {
                  adaptedResult[key] = {'id': result[path][0], 'name': result[path][1]}
                } else if (result[path] === false) {
                  adaptedResult[key] = undefined
                } else {
                  adaptedResult[key] = result[path]
                }
              }
            })

            schema.virtuals.forEach((virtual) => {
              adaptedResult[virtual.name] = virtual.get(adaptedResult)
            })

            adaptedResults.push(adaptedResult)
          })
          if (isSingleResult) {
            adaptedResults = adaptedResults[0]
          }
          resolve(adaptedResults)
        } catch (error) {
          reject(error)
        }
      })
  }

  exec () {
    var that = this
    var func = function (resolve, reject) {
      try {
        that.db.connect(function (error, result) {
          if (error) {
            console.log(error)
            reject(error)
          }
          that.setParams(that.conditions, that.projection, that.schema).then(params => {
            that.db.execute_kw(that.collection, that.queryType, params, function (error, results) {
              if (error) {
                console.log(error)
                reject(error)
              }
              that.adapt(results, that.schema).then(adaptedResults => {
                resolve(adaptedResults)
              }).catch(e => {
                reject(e)
              })
            })
          }).catch(e => {
            reject(e)
          })
        })
      } catch (error) {
        reject(error)
      }
    }
    return new OdooPromise(func, that.model)
  }
}

module.exports = Query
