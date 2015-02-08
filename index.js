#!/usr/bin/env node

var spawn = require('child_process').spawn
var fs = require('fs')
var chalk = require('chalk')
var through = require('through2')
var split = require('split')
var config = require('./lib/config')
var sampleProcess = require('./lib/sample-process')

var crashCounter = 0

var y = chalk.yellow
var r = chalk.red
var g = chalk.green

function start(startupMessage) {
  var cmd = config.cmd || 'sbot server'
  cmd = cmd.split(' ')
  var sbot = spawn(cmd[0], cmd.slice(1))
  console.log(g('started server with pid'), sbot.pid)

  var errorLines = []
  var isParsingError = false
  var lastSample = null
  var sampleTimer = null
  var postTimer = null

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

  sbot.on('close', function (code) {
    console.log(r('server closed with code'), code)
    stopTimeouts()
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
    console.log(y('posting data'), data)
    var args = [ 'add', '--type', msg.type, '--text' , data ]
    var child = spawn('sbot', args)
    child.on('close', function (code) {
      if (code !== 0) return cb(new Error('failed to post feed'))
      cb()
    })
  }

  function sample() {
    sampleTimer = setTimeout(function () {
      sampleProcess(sbot.pid, function (err, data) {
        if (!err) lastSample = data
        console.log(g('sampled data'), JSON.stringify(data))
        sample()
      })
    }, config.sample_timer)
  }

  function postSample() {
    postTimer = setTimeout(function () {
      var msg = { type: 'sys-stat', data: lastSample }
      postMessage(msg, function (err) {
        if (err) console.error(r(err))
        postSample()
      })
    }, config.post_timer)
  }

  function startTimeouts() {
    sample()
    postSample()
  }

  function stopTimeouts() {
    if (sampleTimer !== null) {
      clearTimeout(sampleTimer)
      sampleTimer = null
    }
    if (postTimer !== null) {
      clearTimeout(postTimer)
      sampleTimer = null
    }
  }

  if (startupMessage) {
    console.log(g('startup error message, waiting before posting it'))
    setTimeout(function () {
      postMessage(startupMessage, function (err) {
        if (err) console.error(r(err))
        startTimeouts()
      })
    }, config.startup_message_delay)
  }
  else {
    startTimeouts()
  }
}

start()
