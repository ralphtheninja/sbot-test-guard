#!/usr/bin/env node

var spawn = require('child_process').spawn
var fs = require('fs')
var chalk = require('chalk')
var split = require('split')

var config = require('./lib/config')
var sampleProcess = require('./lib/sample-process')
var parseStderr = require('./lib/parse-stderr.js')
var createClient = require('./lib/rpc.js')
var match = require('match-through')

var crashCounter = 0

function start(startupMessage) {
  var cmd = config.cmd || 'sbot server'
  cmd = cmd.split(' ')
  var sbot = spawn(cmd[0], cmd.slice(1))
  info('sbot started (' + sbot.pid + ')')

  process.on('uncaughtException', function (err) {
    error('uncaught exception', err)
    sbot.kill()
    process.exit(1)
  })

  var lastSample = null
  var sampleTimer = null
  var postTimer = null
  var rpcClient = null

  var parser = parseStderr()
  var log = fs.createWriteStream(__dirname + '/sbot.log', { flags: 'a' })
  sbot.stderr.pipe(parser).pipe(log)

  sbot.stdout.pipe(match(/.*info.*listening.*/i, setupRpc)).pipe(process.stdout)

  function setupRpc() {
    info('connecting to sbot rpc..')
    createClient(function (err, client) {
      if (err) {
        warn('failed to create rpc client', err)
        warn('retrying in', config.rpc_reconnect_timer, 'ms')
        return setTimeout(setupRpc, config.rpc_reconnect_timer)
      }
      info('connected to sbot rpc')
      rpcClient = client
    })
  }

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
      start({ type: 'error-dump', text: parser.lastError })
    }, config.restart_delay)

  })

  function postMessage(msg, cb) {
    info('posting', JSON.stringify(msg))
    if (rpcClient !== null) return rpcClient.add(msg, cb)
    warn('tried to post but rpc client not connected!')
    process.nextTick(cb)
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
      if (!lastSample) return postSample()
      var msg = { type: 'sys-stat', text: lastSample }
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

function warn() {
  output('yellow').apply(null, arguments)
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
