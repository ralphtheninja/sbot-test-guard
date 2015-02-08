#!/usr/bin/env node

var spawn = require('child_process').spawn
var fs = require('fs')
var c = require('chalk')
var config = require('./config')
var getProcessData = require('./get-process-data')

function start() {
  var sbot = spawn('sbot', [ 'server' ],  { stdio: 'inherit' })
  console.log(c.yellow('started server with pid:'), sbot.pid)

  var timer = null

  sbot.on('close', function (code) {
    console.log(c.red('server closed with code:'), code)
    process.nextTick(function () {
      if (timer !== null) {
        clearTimeout(timer)
        timer = null
      }
      start()
    })
  })

  function postFeed(data, cb) {
    var args = [ 'add', '--type', 'post', '--text' ]
    args.push(JSON.stringify(data))
    var child = spawn('sbot', args)
    child.on('close', function (code) {
      if (code !== 0) return cb(new Error('failed to post feed'))
      cb()
    })
  }

  function measure() {
    timer = setTimeout(function () {
      getProcessData(sbot, function (err, data) {
        if (!err) {
          return postFeed(data, function (err) {
            if (err) console.error(c.red(err))
            measure()
          })
        }
        console.error(c.red(err))
        measure()
      })
    }, config.timer)
  }

  measure()

}

start()
