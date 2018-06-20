class OdoosePromise extends Promise {
  constructor (executor, model) {
    super(executor)
    this.model = model
  }

  populate (options) {
    var that = this
    return new Promise(
      function (resolve, reject) {
        try {
          that.then(result => {
            resolve(that.model.populate(options, result))
          })
        } catch (error) {
          return reject(error)
        }
      }
    )
  }
}

module.exports = OdoosePromise
