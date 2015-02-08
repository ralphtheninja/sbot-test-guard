# sbot-test-guard

Does the following:

* Runs a `scuttlebot` instance
* Samples the `sbot` process and writes that data with message type `sys-stat`
* Parses and saves `stderr` from `sbot` and writes that data with message type `error-dump`
* Restarts `sbot` if it crashes or is killed

It is assumed that `scuttlebot` is installed globally.

## Install

```
$ npm install sbot-test-guard -g
```

## Usage

Start the guard.

```
$ sbot-test-guard
started server with pid: 5969
info V/M3 SBOT  use-plugin ""
info V/M3 SBOT  use-plugin "gossip@1.0.0"
info V/M3 SBOT  use-plugin "local@1.0.0"
info V/M3 SBOT  use-plugin "phoenix@1.0.0"
info V/M3 SBOT  use-plugin "blobs@0.0.0"
info V/M3 SBOT  use-plugin "invite@1.0.0"
info V/M3 SBOT  use-plugin "friends@1.0.0"
```

## License
MIT
