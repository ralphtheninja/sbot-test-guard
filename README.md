# sbot-test-guard

Does the following:

1. Runs a `scuttlebot` instance
2. Measures data from the `sbot` process and writes that data to the feed
3. Restarts `sbot` if it crashes or is killed

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
