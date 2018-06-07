'use strict'
var Promise = require('./promise')

class Query {
  constructor (db, schema, collection, conditions, projection, queryType) {
    this.conditions = conditions
    this.db = db
    this.schema = schema
    this.collection = collection
    this.queryType = queryType
  }

  setParams (conditions, projection, schema) {
    return new Promise(
      function (resolve, reject) {
        try {
          var domain
          if (typeof conditions === 'object') {
            domain = [[]]
            Object.keys(conditions).forEach((key) => {
              domain[0].push([schema['obj'][key].path, '=', conditions[key]])
            })
          } else {
            domain = [conditions]
          }

          var options = {fields: []}
          if (projection === undefined) {
            projection = Object.keys(schema['obj'])
          }
          projection.forEach((key) => {
            var field
            if (Array.isArray(schema['obj'][key])) {
              field = schema['obj'][key][0].path
            } else {
              field = schema['obj'][key].path
            }
            if (field !== undefined) {
              options.fields.push(field)
            }
          })
          var params = [domain, options]
          return resolve(params)
        } catch (error) {
          return reject(error)
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
              if (Array.isArray(schema['obj'][key])) {
                path = schema['obj'][key][0].path
              } else {
                path = schema['obj'][key].path
              }
              if (path !== undefined & result[path] !== undefined) {
                if (schema['obj'][key].data !== undefined) {
                  adaptedResult[key] = { data: Buffer.from(result[path], 'base64'), contentType: 'image/jpeg' }
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
          return resolve(adaptedResults)
        } catch (error) {
          return reject(error)
        }
      })
  }

  exec () {
    var that = this
    return new Promise(
      function (resolve, reject) {
        try {
          that.db.connect(function (error, result) {
            if (error) {
              console.log(error)
              return reject(error)
            }
            that.setParams(that.conditions, that.projection, that.schema).then(params => {
              that.db.execute_kw(that.collection, that.queryType, params, function (error, results) {
                if (error) {
                  console.log(error)
                  return reject(error)
                }
                that.adapt(results, that.schema).then(adaptedResults => {
                  return resolve(adaptedResults)
                }).catch(e => {
                  return reject(e)
                })
              })
            }).catch(e => {
              return reject(e)
            })
          })
        } catch (error) {
          reject(error)
        }
      })
  }

  populate (options) {
    return new Promise()
  }
}

module.exports = Query
