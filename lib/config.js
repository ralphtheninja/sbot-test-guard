module.exports = require('rc')('sbot-test-guard', {
  cmd: 'sbot server',
  sample_timer: 30 * 1000,
  post_timer: 15 * 60 * 1000,
  restart_delay: 1000,
  startup_message_delay: 5000,
  rpc_reconnect_timer: 5000,
  crash: {
    limit: 1,
    time_frame: 20000
  }
})
