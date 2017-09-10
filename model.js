
function Model (doc, fields, skipId) {
  var model = doc
  return model
}

const setParams = (conditions, projection, schema) => {
  return new Promise(
    function (resolve, reject) {
      try {
        var domain = [[]]
        Object.keys(conditions).forEach((key) => {
          domain[0].push([schema['obj'][key].path, '=', conditions[key]])
        })

        var options = {fields: []}
        Object.keys(schema['obj']).forEach((key) => {
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
            if (path !== undefined) {
              adaptedResult[key] = result[path]
            }
          })
          adaptedResults.push(adaptedResult)
        })
        return resolve(adaptedResults)
      } catch (error) {
        return reject(error)
      }
    })
}

Model.compile = function compile (name, schema, collectionName, connection, base) {
  var model

  model = this
  model.modelName = name
  model.model = Model.prototype.model
  model.db = connection

  model.schema = schema
  model.collection = model.prototype.collection

  return model
}

Model.find = function find (conditions, projection, options) {
  var db = this.db
  var schema = this.schema
  return new Promise(
    function (resolve, reject) {
      try {
        db.connect(function (error, result) {
          if (error) {
            console.log(error)
            return reject(error)
          }
          setParams(conditions, projection, schema).then(params => {
            db.execute_kw('product.product', 'search_read', params, function (error, results) {
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

module.exports = exports = Model
