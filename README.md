# tick-tock

[![Build Status](https://travis-ci.org/unshiftio/tick-tock.svg?branch=master)](https://travis-ci.org/unshiftio/tick-tock)
[![NPM version](https://badge.fury.io/js/tick-tock.svg)](http://badge.fury.io/js/tick-tock)
[![Coverage Status](https://img.shields.io/coveralls/unshiftio/tick-tock.svg)](https://coveralls.io/r/unshiftio/tick-tock?branch=master)

`tick-tock` is a small timer and `setTimeout` management library. Nothing to
fancy, but fancy enough to make your code more readable.

## Installation

This library can be used with both browserify and node.js and can be installed
using npm:

```
npm install --save tick-tock
```

## Usage

In all example we assume that you've required and initialized the library using:

```js
'use strict';

var Tick = require('tick-tock')
  , tock = new Tick();
```

All methods return `this` unless stated otherwise. 

### Tock.setTimeout()

The `setTimeout` method adds as you might have expected.. a new setTimeout. The
timeouts are stored based on the name that your provide them. If you've already
stored a timer with the given name, it will add the supplied callback to the
same stack so only one timer is used and they all run at the same time. Normally
you would supply the `setTimeout` method with a number indicating long it should
timeout. In this library we also support human readable strings.

```js
tock.setTimeout('foo', function () {}, 10);

// Ran at the same point in time as the timeout above
setTimeout(function () {
  tock.setTimeout('foo', function () {}, 10); 
}, 5);

tock.setTimeout('another', function () {}, '10 minutes');
```

### Tock.setInterval()

Exactly the same method and functionality as above but instead of only being
called once, it will called at an interval.

### Tock.clear()

The `clear` method allows you to clear every stored timeout by name. You can
supply it multiple arguments (strings) to clear all given timers and if you
supply 1 strings it can be comma separated list of names. If no arguments are
supplied it will clear all timers in this instance.

```js
tock.clear('foo', 'bar');
tock.clear('foo, bar'); // Same as above.
tock.clear(); // Nuke everything.
```

### Tock.active()

Check if there's an active timer for the given name and returns a boolean.

```js
tock.active('foo'); // true;
tock.clear();
tock.active('foo'); // false;
```

### Tock.adjust()

There are cases where you sometimes need to update or change the interval of an
`setTimeout` or `setInterval` for example in the case of a setTimeout which
coordinates a heartbeat. In order to make this easier you call the `.adjust`
method with the name of the timeout that you want to adjust and the new
interval/timeout.

```js
tock.setTimeout('heartbeat timeout', function () {});

// you recieved a new heartbeat so you want to reset or adjust the heartbeat;
tock.adjust('heartbeat timeout', '1 second');
```

## License

MIT
