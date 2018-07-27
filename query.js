class Query {
  constructor (db, schema, collection, conditions, projection, queryType, opts) {
    this.conditions = conditions
    this.db = db
    this.schema = schema
    this.collection = collection
    this.queryType = queryType
    this.projection = projection
    this.opts = opts
  }

  setParams (conditions, projection, schema) {
    var that = this
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
          if (that.opts['context'] !== undefined && that.opts['context'] !== null) {
            options['context'] = that.opts['context']
          }
          var params = [domain, options]
          resolve(params)
        } catch (error) {
          reject(error)
        }
      })
  }

  setWriteParams (conditions, update, schema) {
    var that = this
    return new Promise(
      function (resolve, reject) {
        try {
          let domain
          domain = [conditions]

          let fieldsToUpdate = {}
          if (update === undefined) {
            let error = new Error('No fields to update')
            reject(error)
          }
          Object.keys(update).forEach((key) => {
            let field
            let value
            let isOnetoManyField = Array.isArray(schema['obj'][key])
            let isRefField = (isOnetoManyField && ('ref' in schema['obj'][key][0])) || (!isOnetoManyField && ('ref' in schema['obj'][key]))
            if (schema['obj'][key] !== undefined && key !== 'id') {
              if (isOnetoManyField && !isRefField) {
                value = update[key]
                field = schema['obj'][key][0].path
              } else {
                if (isRefField && Number.isInteger(update[key])) {
                  field = schema['obj'][key].path
                  value = update[key]
                } else if (isRefField && Number.isInteger(update[key]['id'])) {
                  field = schema['obj'][key].path
                  value = update[key]['id']
                } else {
                  field = schema['obj'][key].path
                  value = update[key]
                }
              }
              if (field !== undefined && field !== null) {
                fieldsToUpdate[field] = value
              }
            }
          })

          let options = {}
          if (that.opts !== undefined && that.opts['context'] !== undefined) {
            options['context'] = that.opts['context']
          }
          let params = [[domain, fieldsToUpdate], options]
          resolve(params)
        } catch (error) {
          reject(error)
        }
      })
  }

  setCreateParams (newDocument, schema) {
    var that = this
    return new Promise(
      function (resolve, reject) {
        try {
          let fieldsToUpdate = {}
          if (newDocument === undefined) {
            let error = new Error('Nothing to create')
            reject(error)
          }
          Object.keys(newDocument).forEach((key) => {
            let field
            let value
            let isOnetoManyField = Array.isArray(schema['obj'][key])
            let isRefField = (isOnetoManyField && ('ref' in schema['obj'][key][0])) || (!isOnetoManyField && ('ref' in schema['obj'][key]))
            if (schema['obj'][key] !== undefined && key !== 'id') {
              if (isOnetoManyField && !isRefField) {
                value = newDocument[key]
                field = schema['obj'][key][0].path
              } else {
                if (isRefField && Number.isInteger(newDocument[key])) {
                  field = schema['obj'][key].path
                  value = newDocument[key]
                } else if (isRefField && Number.isInteger(newDocument[key]['id'])) {
                  field = schema['obj'][key].path
                  value = newDocument[key]['id']
                } else {
                  field = schema['obj'][key].path
                  value = newDocument[key]
                }
              }
              if (field !== undefined && field !== null) {
                fieldsToUpdate[field] = value
              }
            }
          })

          let options = {}
          if (that.opts !== undefined && that.opts['context'] !== undefined) {
            options['context'] = that.opts['context']
          }

          let params = [[fieldsToUpdate], options]
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
    return new Promise(
      function (resolve, reject) {
        try {
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
        } catch (error) {
          reject(error)
        }
      })
  }

  save (update) {
    var that = this
    return new Promise(
      function (resolve, reject) {
        try {
          that.setWriteParams(that.conditions, update, that.schema).then(params => {
            if (params[0][1] === {}) {
              reject(new Error('No fields to update'))
            }
            that.db.execute_kw(that.collection, 'write', params, function (error, result) {
              if (error) {
                console.log(error)
                reject(error)
              }
              resolve(result)
            })
          }).catch(e => {
            reject(e)
          })
        } catch (error) {
          reject(error)
        }
      })
  }

  create (newDocument) {
    var that = this
    return new Promise(
      function (resolve, reject) {
        try {
          that.setCreateParams(newDocument, that.schema).then(params => {
            if (params[0][1] === {}) {
              reject(new Error('No fields to update'))
            }
            that.db.execute_kw(that.collection, 'create', params, function (error, result) {
              if (error) {
                console.log(error)
                reject(error)
              }
              newDocument['id'] = result
              resolve(newDocument)
            })
          }).catch(e => {
            reject(e)
          })
        } catch (error) {
          reject(error)
        }
      })
  }

  delete (id) {
    var that = this
    return new Promise(
      function (resolve, reject) {
        try {
          that.db.execute_kw(that.collection, 'unlink', [[id]], function (error, result) {
            if (error) {
              console.log(error)
              reject(error)
            }
            resolve(result)
          })
        } catch (error) {
          reject(error)
        }
      })
  }
}

module.exports = Query
