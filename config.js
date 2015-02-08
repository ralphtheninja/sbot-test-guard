module.exports = require('rc')('sbot-test-guard', {
  probe_timer: 10000,
  restart_delay: 1000,
  startup_message_delay: 5000,
  crash: {
    limit: 2,
    time_frame: 10000
  }
})
