
function Schema (obj, options) {
  if (!(this instanceof Schema)) {
    return new Schema(obj, options)
  }

  this.obj = obj
  this.paths = {}
  this.aliases = {}
  this.subpaths = {}
  this.virtuals = {}
  this.singleNestedPaths = {}
  this.nested = {}
  this.inherits = {}
  this.callQueue = []
  this._indexes = []
  this.methods = {}
  this.statics = {}
  this.tree = {}
  this.query = {}
  this.childSchemas = []
  this.plugins = []
}

module.exports = exports = Schema
