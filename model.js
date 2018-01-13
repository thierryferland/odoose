
// Shit implementation

function Model (doc, fields, skipId) {
  // var model = doc
  // return model
}

const setParams = (conditions, projection, schema) => {
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
          var field = schema['obj'][key].path
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

const adapt = (results, schema) => {
  return new Promise(
    function (resolve, reject) {
      try {
        var adaptedResults = []
        results.forEach((result) => {
          var adaptedResult = {}
          Object.keys(schema['obj']).forEach((key) => {
            var path = schema['obj'][key].path
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

          // Object.keys(result).forEach((key) => {
          //   var path = schema['obj'][key].path
          //   if (schema['obj'][key].data !== undefined) {
          //     adaptedResult[key] = { data: Buffer.from(result[path], 'base64'), contentType: 'image/jpeg' }
          //   } else {
          //     if (path !== undefined) {
          //       adaptedResult[key] = result[path]
          //     }
          //   }
          // })
          adaptedResults.push(adaptedResult)
        })
        return resolve(adaptedResults)
      } catch (error) {
        return reject(error)
      }
    })
}

Model.compile = function (name, schema, collectionName, connection, base) {
  var model
  model = new Model()
  // Bad, to to be changed
  model.findById = this.findById
  model.find = this.find
  model.modelName = name
  model.model = Model.prototype.model
  model.db = connection

  model.schema = schema
  // model.collection = model.prototype.collection
  model.collectionName = collectionName
  return model
}

Model.find = function find (conditions, projection, options) {
  var db = this.db
  var schema = this.schema
  var collectionName = this.collectionName
  projection = projection.split(' ')
  return new Promise(
    function (resolve, reject) {
      try {
        db.connect(function (error, result) {
          if (error) {
            console.log(error)
            return reject(error)
          }
          setParams(conditions, projection, schema).then(params => {
            db.execute_kw(collectionName, 'search_read', params, function (error, results) {
              if (error) {
                console.log(error)
                return reject(error)
              }
              adapt(results, schema).then(adaptedResults => {
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

Model.findById = function find (id, projection, options) {
  var db = this.db
  var schema = this.schema
  var collectionName = this.collectionName
  var selectedFields = projection.split(' ')
  return new Promise(
    function (resolve, reject) {
      try {
        db.connect(function (error, result) {
          if (error) {
            console.log(error)
            return reject(error)
          }
          setParams(id, selectedFields, schema).then(params => {
            db.execute_kw(collectionName, 'read', params, function (error, result) {
              if (error) {
                console.log(error)
                return reject(error)
              }
              adapt([result], schema).then(adaptedResults => {
                return resolve(adaptedResults[0])
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

module.exports = exports = Model
