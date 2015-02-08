var os = require('os')
var after = require('after')
var status = require('proc-tools').status

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

  status(pid, function (err, data) {
    result.process = data
    done()
  })
}
