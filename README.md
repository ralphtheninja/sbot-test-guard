# sbot-test-guard

Does the following:

* Runs a `scuttlebot` instance
* Samples the `sbot` process and writes that data with message type `sys-stat`
* Parses and saves `stderr` from `sbot` and writes that data with message type `error-dump`
* Restarts `sbot` if it crashes or is killed
* Rate limited restarts. If `sbot` crashes too often the guard will exit

It is assumed that `scuttlebot` is installed globally.

## Install

```
$ npm install sbot-test-guard -g
```

## Usage

Start the guard.

```
$ sbot-test-guard
```

Output. If `sbot` crashes the error message is saved and posted next time `sbot` is launched.

```
started server with pid 16914
sampled data {"os":{"type":"Linux","arch":"x64","platform":"linux","loadavg":[0.1884765625,0.33056640625,0.45947265625]},"process":{"name":"node","state":"S (sleeping)","tgid":"16914","ngid":"0","pid":"16914","ppid":"16912","tracerpid":"0","uid":["1000","1000","1000","1000"],"gid":["1000","1000","1000","1000"],"fdsize":"64","groups":"4 20 24 25 27 29 30 44 46 100 108 120 1000 ","vmpeak":"970140 kB","vmsize":"970140 kB","vmlck":"0 kB","vmpin":"0 kB","vmhwm":"37108 kB","vmrss":"37108 kB","vmdata":"936152 kB","vmstk":"136 kB","vmexe":"8500 kB","vmlib":"4688 kB","vmpte":"244 kB","vmswap":"0 kB","threads":"6","sigq":"2/62763","sigpnd":"0000000000000000","shdpnd":"0000000000000000","sigblk":"0000000000000000","sigign":"0000000000001000","sigcgt":"0000000180004202","capinh":"0000000000000000","capprm":"0000000000000000","capeff":"0000000000000000","capbnd":"0000001fffffffff","seccomp":"0","cpus_allowed":"f","cpus_allowed_list":"0-3","mems_allowed":"00000000,00000001","mems_allowed_list":"0","voluntary_ctxt_switches":"63","nonvoluntary_ctxt_switches":"1381"}}
server closed with code 8
started server with pid 16924
startup error message, waiting before posting it
posting data "Error: wtf dude something went wrong/n    at die (/home/lms/src/ssbc/scuttlebot/bin.js:16:9)/n    at null._onTimeout (/home/lms/src/ssbc/scuttlebot/bin.js:19:3)"
```

## License
MIT
