#!/usr/bin/env node

var spawn = require('child_process').spawn
var fs = require('fs')
var chalk = require('chalk')
var through = require('through2')
var split = require('split')
var config = require('./config')
var getProcessData = require('./get-process-data')

var crashCounter = 0

var y = chalk.yellow
var r = chalk.red
var g = chalk.green

function start(startupMessage) {
  var sbot = spawn('sbot', [ 'server' ])
  console.log(g('started server with pid:'), sbot.pid)

  var errorLines = []
  var isParsingError = false

  sbot.stderr.pipe(split()).pipe(through(function (chunk, enc, cb) {
    var line = chunk.toString()
    if (isParsingError) {
      if (/^\s+at\s+\S+\s+\S+$/gi.test(line)) {
        errorLines.push(line)
      }
      else {
        isParsingError = false
      }
    }
    else if (/^Error:/.test(line)) {
      isParsingError = true
      errorLines.push(line)
    }
    this.push(chunk + '\n')
    cb()
  })).pipe(fs.createWriteStream(__dirname + '/sbot.log', { flags: 'a' }))

  var sample_timer = null

  sbot.on('close', function (code) {
    console.log(r('server closed with code:'), code)
    if (sample_timer !== null) {
      clearTimeout(sample_timer)
      sample_timer = null
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

    setTimeout(function () {
      if (!errorLines.length) return start()
      start({ type: 'error-dump', data: errorLines.join('/n') })
    }, config.restart_delay)

  })

  function postMessage(msg, cb) {
    var data = JSON.stringify(msg.data)
    var args = [ 'add', '--type', msg.type, '--text' , data ]
    var child = spawn('sbot', args)
    child.on('close', function (code) {
      if (code !== 0) return cb(new Error('failed to post feed'))
      cb()
    })
  }

  function sample() {
    sample_timer = setTimeout(function () {
      getProcessData(sbot, function (err, data) {
        if (!err) {
          var msg = { type: 'sys-stat', data: data }
          return postMessage(msg, function (err) {
            if (err) console.error(r(err))
            sample()
          })
        }
        console.error(r(err))
        sample()
      })
    }, config.sample_timer)
  }

  if (startupMessage) {
    console.log(g('startup error message, waiting before posting it'))
    setTimeout(function () {
      postMessage(startupMessage, function (err) {
        if (err) console.error(r(err))
        sample()
      })
    }, config.startup_message_delay)
  }
  else {
    sample()
  }
}

start()
