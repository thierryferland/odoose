var Schema = require('./schema')
var Model = require('./model')

class Odoose {
  constructor () {
    this.connections = []
    this.opts = {}
    this.models = new Map()
    this.modelSchemas = new Map()
    this.Schema = Schema
    this.Model = Model
  }

  model (name, schema, collection, skipInit) {
    let connection = this.connections[0]
    let model = Model.compile(name, schema, collection, connection, this)
    this.modelSchemas.set(name, schema)
    this.models.set(name, model)
    return model
  }

  connect (db, opts) {
    this.connections.push(db)
    this.opts = opts
  }

  authenticate (user) {
    var db = this.connections[0]
    db.username = user.username
    db.password = user.password
    var func = function (resolve, reject) {
      try {
        db.connect(function (error, response) {
          if (error) {
            reject(error)
          }
          db.execute_kw('res.partner', 'check_access_rights', [['read', false]], function (error, response) {
            if (error | response === null) {
              reject(error)
            }
            resolve(response)
          })
        })
      } catch (error) {
        reject(error)
      }
    }
    return new Promise(func)
  }
}

module.exports = new Odoose()
