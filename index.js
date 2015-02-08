#!/usr/bin/env node

var spawn = require('child_process').spawn
var fs = require('fs')
var chalk = require('chalk')
var config = require('./config')
var getProcessData = require('./get-process-data')

var crashCounter = 0

var y = chalk.yellow
var r = chalk.red

function start() {
  var sbot = spawn('sbot', [ 'server' ], { stdio: 'inherit' })
  console.log(y('started server with pid:'), sbot.pid)

  var probe_timer = null

  sbot.on('close', function (code) {
    console.log(r('server closed with code:'), code)
    if (probe_timer !== null) {
      clearTimeout(probe_timer)
      probe_timer = null
    }
    if (crashCounter++ === 0) {
      setTimeout(function () {
        if (crashCounter >= config.crash.limit) {
          console.error(r('sbot reached crash limit'),
                        y('crashed'),
                        crashCounter,
                        y('times within'),
                        config.crash.time_frame / 1000,
                        y('seconds'))
          process.exit(1)
        }
        else {
          crashCounter = 0
        }
      }, config.crash.time_frame)
    }
    process.nextTick(start)
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

  function probe() {
    probe_timer = setTimeout(function () {
      getProcessData(sbot, function (err, data) {
        if (!err) {
          return postFeed(data, function (err) {
            if (err) console.error(r(err))
            probe()
          })
        }
        console.error(r(err))
        probe()
      })
    }, config.probe_timer)
  }

  probe()

}

start()
