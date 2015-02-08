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

  var errorMessage = ''
  var isParsingError = false

  sbot.stderr.pipe(split()).pipe(through(function (chunk, enc, cb) {
    var line = chunk.toString()
    if (isParsingError) {
      if (/^\s+at\s+\S+\s+\S+$/gi.test(line)) {
        errorMessage += line + '\n'
      }
      else {
        isParsingError = false
      }
    }
    else if (/^Error:/.test(line)) {
      isParsingError = true
      errorMessage += line + '\n'
    }
    this.push(chunk + '\n')
    cb()
  })).pipe(fs.createWriteStream(__dirname + '/sbot.log', { flags: 'a' }))

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

    setTimeout(function () {
      start(errorMessage)
    }, config.restart_delay)

  })

  function postFeed(data, cb) {
    data = JSON.stringify(data)
    console.log(g('posting feed:'), data)
    var args = [ 'add', '--type', 'post', '--text' , data ]
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

  if (startupMessage && startupMessage.length > 0) {
    console.log(g('startup error message, waiting before posting it'))
    setTimeout(function () {
      postFeed(startupMessage, function (err) {
        if (err) console.error(r(err))
        probe()
      })
    }, config.startup_message_delay)
  }
  else {
    probe()
  }
}

start()
