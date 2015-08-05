'use strict';

var has = Object.prototype.hasOwnProperty
  , ms = require('millisecond');

/**
 * Timer instance.
 *
 * @constructor
 * @param {Object} timer New timer instance.
 * @param {Function} clear Clears the timer instance.
 * @param {Function} duration Duration of the timer.
 * @param {Function} fn The functions that need to be executed.
 * @api private
 */
function Timer(timer, clear, duration, fn) {
  this.start = +(new Date());
  this.duration = duration;
  this.clear = clear;
  this.timer = timer;
  this.fns = [fn];
}

/**
 * Calculate the time left for a given timer.
 *
 * @returns {Number} Time in milliseconds.
 * @api public
 */
Timer.prototype.remaining = function remaining() {
  return this.duration - this.taken();
};

/**
 * Calculate the amount of time it has taken since we've set the timer.
 *
 * @returns {Number}
 * @api public
 */
Timer.prototype.taken = function taken() {
  return +(new Date()) - this.start;
};

/**
 * Custom wrappers for the various of clear{whatever} functions. We cannot
 * invoke them directly as this will cause thrown errors in Google Chrome with
 * an Illegal Invocation Error
 *
 * @see #2
 * @type {Function}
 * @api private
 */
function unsetTimeout(id) { clearTimeout(id); }
function unsetInterval(id) { clearInterval(id); }
function unsetImmediate(id) { clearImmediate(id); }

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
    if (!(name in tock.timers)) return;

    var timer = tock.timers[name]
      , fns = timer.fns.slice()
      , l = fns.length
      , i = 0;

    if (clear) tock.clear(name);
    else tock.start = +new Date();

    for (; i < l; i++) {
      fns[i].call(tock.context);
    }
  };
};

/**
 * Add a new timeout.
 *
 * @param {String} name Name of the timer.
 * @param {Function} fn Completion callback.
 * @param {Mixed} time Duration of the timer.
 * @returns {Tick}
 * @api public
 */
Tick.prototype.setTimeout = function timeout(name, fn, time) {
  var tick = this
    , tock;

  if (tick.timers[name]) {
    tick.timers[name].fns.push(fn);
    return tick;
  }

  tock = ms(time);
  tick.timers[name] = new Timer(
    setTimeout(tick.tock(name, true), ms(time)),
    unsetTimeout,
    tock,
    fn
  );

  return tick;
};

/**
 * Add a new interval.
 *
 * @param {String} name Name of the timer.
 * @param {Function} fn Completion callback.
 * @param {Mixed} time Interval of the timer.
 * @returns {Tick}
 * @api public
 */
Tick.prototype.setInterval = function interval(name, fn, time) {
  var tick = this
    , tock;

  if (tick.timers[name]) {
    tick.timers[name].fns.push(fn);
    return tick;
  }

  tock = ms(time);
  tick.timers[name] = new Timer(
    setInterval(tick.tock(name), ms(time)),
    unsetInterval,
    tock,
    fn
  );

  return tick;
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
  var tick = this;

  if ('function' !== typeof setImmediate) return tick.setTimeout(name, fn, 0);

  if (tick.timers[name]) {
    tick.timers[name].fns.push(fn);
    return tick;
  }

  tick.timers[name] = new Timer(
    setImmediate(tick.tock(name, true)),
    unsetImmediate,
    0,
    fn
  );

  return tick;
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
    , tick = this
    , timer, i, l;

  if (args.length === 1 && 'string' === typeof args[0]) {
    args = args[0].split(/[, ]+/);
  }

  if (!args.length) {
    for (timer in tick.timers) {
      if (has.call(tick.timers, timer)) args.push(timer);
    }
  }

  for (i = 0, l = args.length; i < l; i++) {
    timer = tick.timers[args[i]];

    if (!timer) continue;
    timer.clear(timer.timer);

    timer.fns = timer.timer = timer.clear = null;
    delete tick.timers[args[i]];
  }

  return tick;
};

/**
 * Adjust a timeout or interval to a new duration.
 *
 * @returns {Tick}
 * @api public
 */
Tick.prototype.adjust = function adjust(name, time) {
  var interval
    , tick = this
    , tock = ms(time)
    , timer = tick.timers[name];

  if (!timer) return tick;

  interval = timer.clear === unsetInterval;
  timer.clear(timer.timer);
  timer.start = +(new Date());
  timer.duration = tock;
  timer.timer = (interval ? setInterval : setTimeout)(tick.tock(name, !interval), tock);

  return tick;
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

//
// Expose the timer factory.
//
Tick.Timer = Timer;
module.exports = Tick;
