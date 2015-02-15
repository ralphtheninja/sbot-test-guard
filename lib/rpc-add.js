var fs = require('fs')
var join = require('path').join
var ssbKeys = require('ssb-keys')
var config  = require('ssb-config')
var manifestFile = join(config.path, 'manifest.json')
var manifest = JSON.parse(fs.readFileSync(manifestFile))
var Rpc = require('scuttlebot/client')
var keys = ssbKeys.loadOrCreateSync(join(config.path, 'secret'))

function rpcAdd(data, cb) {
  var rpc = Rpc(config, manifest)
  rpc.auth(ssbKeys.signObj(keys, {
    role: 'client',
    ts: Date.now(),
    public: keys.public
  }), function (err) {
    if (err) return cb(err)
    rpc.add(data, cb)
  })
}

module.exports = rpcAdd
