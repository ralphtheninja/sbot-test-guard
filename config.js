module.exports = require('rc')('sbot-test-guard', {
  probe_timer: 30000,
  crash: {
    limit: 2,
    time_frame: 20000
  }
})
