module.exports = require('rc')('sbot-test-guard', {
  sample_timer: 30 * 1000,
  post_timer: 15 * 60 * 1000,
  restart_delay: 1000,
  startup_message_delay: 5000,
  crash: {
    limit: 2,
    time_frame: 10000
  }
})
