var os = require('os')
var after = require('after')
var usage = require('usage')

module.exports = function (pid, cb) {
  var result = {}

  result.os = {
    type: os.type(),
    arch: os.arch(),
    platform: os.platform(),
    loadavg: os.loadavg()
  }

  var done = after(1, function (err) {
    cb(err, result)
  })

  usage.lookup(pid, { keepHistory: true }, function (err, data) {
    result.process = data
    done()
  })
}
