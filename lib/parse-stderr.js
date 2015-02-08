var PassThrough = require('readable-stream').PassThrough
var through = require('through2')
var split = require('split')

module.exports = function () {
  var pass = new PassThrough()
  var error = pass.lastError = ''

  pass.pipe(split()).pipe(through(function (chunk, enc, cb) {
    var line = chunk.toString()
    if (error) {
      if (/^\s+at\s+\S+\s+\S+$/gi.test(line)) {
        error += line + '\n'
      }
      else {
        pass.lastError = error
        error = ''
      }
    }
    else if (/^Error:/.test(line)) {
      error += line + '\n'
    }
    this.push(chunk + '\n')
    cb()
  }))

  return pass
}
