'use strict';

var has = Object.prototype.hasOwnProperty;

//
// Attempt to detect if we have support for setImmediate or process.nextTick so
// we can use it in our setImmediate function.
//
var next = 'object' === typeof process && 'function' === process.nextTick
  ? process.nextTick
  : null;

//
// The process.nexTick doesn't have a way to cancel the scheduled tick so we
// detect it first and know that when next is a function we cannot clear it.
//
if ('function' === typeof setImmediate) next = {
  clearImmediate: clearImmediate,
  setImmediate: setImmediate
};

/**
 * Simple timer management.
 *
 * @constructor
 * @param {Mixed} context Context of the callbacks that we execute.
 * @api public
 */
function Tick(context) {
  if (!(this instanceof Tick)) return new Tick(context);

  this.timers = {};
  this.context = context || this;
}

/**
 * Return a function which will just iterate over all assigned callbacks and
 * optionally clear the timers from memory if needed.
 *
 * @param {String} name Name of the timer we need to execute.
 * @param {Boolean} clear Also clear from memory.
 * @returns {Function}
 * @api private
 */
Tick.prototype.tock = function ticktock(name, clear) {
  var tock = this;

  return function tickedtock() {
    var timer = tock.timers[name]
      , fns;

    if (!timer) return;
    fns = timer.fns.slice();

    if (clear) tock.clear(name);
    for (var i = 0, l = fns.length; i < l; i++) {
      fns[i].call(tock.context);
    }
  };
};

/**
 * Add a new timeout.
 *
 * @param {String} name Name of the timer.
 * @param {Function} fn Completion callback.
 * @param {Mixed} ms Duration of the timer.
 * @returns {Tick}
 * @api public
 */
Tick.prototype.setTimeout = function timeout(name, fn, ms) {
  if (this.timers[name]) {
    this.timers[name].fns.push(fn);
    return this;
  }

  this.timers[name] = {
    timer: setTimeout(this.tock(name, true), Tick.parse(ms)),
    clear: clearTimeout,
    fns: [fn]
  };

  return this;
};

/**
 * Add a new interval.
 *
 * @param {String} name Name of the timer.
 * @param {Function} fn Completion callback.
 * @param {Mixed} ms Interval of the timer.
 * @returns {Tick}
 * @api public
 */
Tick.prototype.setInterval = function interval(name, fn, ms) {
  if (this.timers[name]) {
    this.timers[name].fns.push(fn);
    return this;
  }

  this.timers[name] = {
    timer: setInterval(this.tock(name), Tick.parse(ms)),
    clear: clearInterval,
    fns: [fn]
  };

  return this;
};

/**
 * Add a new setImmediate.
 *
 * @param {String} name Name of the timer.
 * @param {Function} fn Completion callback.
 * @returns {Tick}
 * @api public
 */
Tick.prototype.setImmediate = function immediate(name, fn) {
  if (!next) return this.setTimeout(name, fn, 0);

  if (this.timers[name]) {
    this.timers[name].fns.push(fn);
    return this;
  }

  this.timers[name] = {
    timer: (next.setImmediate || next)(this.tock(name, true)),
    clear: next.clearImmediate,
    fns: [fn]
  };

  return this;
};

/**
 * Check if we have a timer set.
 *
 * @param {String} name
 * @returns {Boolean}
 * @api public
 */
Tick.prototype.active = function active(name) {
  return name in this.timers;
};

/**
 * Properly clean up all timeout references. If no arguments are supplied we
 * will attempt to clear every single timer that is present.
 *
 * @param {Arguments} ..args.. The names of the timeouts we need to clear
 * @returns {Tick}
 * @api public
 */
Tick.prototype.clear = function clear() {
  var args = arguments.length ? arguments : []
    , timer, i, l;

  if (args.length === 1 && 'string' === typeof args[0]) {
    args = args[0].split(/[\,|\s]+/);
  }

  if (!args.length) {
    for (timer in this.timers) {
      if (has.call(this.timers, timer)) args.push(timer);
    }
  }

  for (i = 0, l = args.length; i < l; i++) {
    timer = this.timers[args[i]];

    if (!timer) continue;
    if (timer.clear) timer.clear(timer.timer);

    timer.fns.length = 0;
    delete this.timers[args[i]];
  }

  return this;
};

/**
 * We will no longer use this module, prepare your self for global cleanups.
 *
 * @returns {Boolean}
 * @api public
 */
Tick.prototype.end = Tick.prototype.destroy = function end() {
  if (!this.context) return false;

  this.clear();
  this.context = this.timers = null;

  return true;
};

/**
 * Adjust a timeout or interval to a new duration.
 *
 * @returns {Tick}
 * @api public
 */
Tick.prototype.adjust = function adjust(name, ms) {
  var timer = this.timers[name]
    , interval;

  if (!timer) return this;

  interval = timer.clear === clearInterval;
  timer.clear(timer.timer);
  timer.timer = (interval ? setInterval : setTimeout)(this.tock(name, !interval), Tick.parse(ms));

  return this;
};

/**
 * Parse a time string and return the number value of it.
 *
 * @returns {Number}
 * @api private
 */
Tick.parse = require('millisecond');
//
// Expose the timer factory.
//
module.exports = Tick;
