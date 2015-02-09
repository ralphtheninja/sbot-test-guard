#!/usr/bin/env node

var spawn = require('child_process').spawn
var fs = require('fs')
var chalk = require('chalk')
var through = require('through2')
var split = require('split')
var config = require('./lib/config')
var sampleProcess = require('./lib/sample-process')
var parseStderr = require('./lib/parse-stderr.js')

var crashCounter = 0

var y = chalk.yellow
var r = chalk.red
var g = chalk.green

function start(startupMessage) {
  var cmd = config.cmd || 'sbot server'
  cmd = cmd.split(' ')
  var sbot = spawn(cmd[0], cmd.slice(1), { stdio: 'inherit' })
  info('sbot started (' + sbot.pid + ')')

  var lastSample = null
  var sampleTimer = null
  var postTimer = null

  var parser = parseStderr()
  var log = fs.createWriteStream(__dirname + '/sbot.log', { flags: 'a' })
  process.stderr.pipe(parser).pipe(log)

  sbot.on('close', function (code) {
    error('sbot exited (' + code + ')')
    stopTimeouts()
    if (crashCounter++ === 0) {
      setTimeout(function () {
        if (crashCounter >= config.crash.limit) {
          error('sbot crashed', crashCounter, 'times within',
                config.crash.time_frame / 1000, 'seconds')
          process.exit(1)
        }
        else {
          crashCounter = 0
        }
      }, config.crash.time_frame)
    }

    setTimeout(function () {
      if (!parser.lastError) return start()
      start({ type: 'error-dump', data: parser.lastError })
    }, config.restart_delay)

  })

  function postMessage(msg, cb) {
    var data = JSON.stringify(msg.data)
    info('posting', data)
    var args = [ 'add', '--type', msg.type, '--text' , data ]
    var child = spawn('sbot', args)
    child.on('close', function (code) {
      if (code !== 0) return cb(new Error('failed to post feed'))
      cb()
    })
  }

  function sample() {
    sampleTimer = setTimeout(function () {
      info('sampling')
      sampleProcess(sbot.pid, function (err, data) {
        if (err) error(err)
        else lastSample = data
        sample()
      })
    }, config.sample_timer)
  }

  function postSample() {
    postTimer = setTimeout(function () {
      var msg = { type: 'sys-stat', data: lastSample }
      postMessage(msg, function (err) {
        if (err) error(err)
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
    setTimeout(function () {
      postMessage(startupMessage, function (err) {
        if (err) error(err)
        startTimeouts()
      })
    }, config.startup_message_delay)
  }
  else {
    startTimeouts()
  }
}

function info() {
  output('green').apply(null, arguments)
}

function error() {
  output('red').apply(null, arguments)
}

function output(color) {
  return function () {
    var str = ' ' + [].slice.apply(arguments).join(' ') + ' '
    console.log(chalk.inverse[color](' GUARD ') + chalk.inverse(str))
  }
}

start()
