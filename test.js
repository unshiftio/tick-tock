describe('ticktock', function () {
  'use strict';

  var assume = require('assume')
    , Tick = require('./')
    , tock;

  function fail() {
    throw new Error('I should never be executed');
  }

  context = { foo: 'bar' };

  beforeEach(function () {
    tock = new Tick();
  });

  afterEach(function () {
    tock.end();
  });

  this.timeout(30000);

  it('is exported as a function', function () {
    assume(Tick).is.a('function');
  });

  it('can be constructed without new', function () {
    var tick = Tick();

    assume(tick).is.instanceOf(Tick);
  });

  describe('.parse', function () {
    it('should preserve ms', function () {
      assume(Tick.parse('100')).to.equal(100);
    });

    it('can parse numbers', function () {
      assume(Tick.parse(100)).to.equal(100);
    });

    it('should convert from m to ms', function () {
      assume(Tick.parse('1m')).to.equal(60000);
      assume(Tick.parse('1min')).to.equal(60000);
      assume(Tick.parse('1mins')).to.equal(60000);
      assume(Tick.parse('1minute')).to.equal(60000);
      assume(Tick.parse('1minutes')).to.equal(60000);
    });

    it('should convert from h to ms', function () {
      assume(Tick.parse('1h')).to.equal(3600000);
      assume(Tick.parse('1hr')).to.equal(3600000);
      assume(Tick.parse('1hrs')).to.equal(3600000);
      assume(Tick.parse('1hour')).to.equal(3600000);
      assume(Tick.parse('1hours')).to.equal(3600000);
    });

    it('should convert d to ms', function () {
      assume(Tick.parse('2d')).to.equal(172800000);
      assume(Tick.parse('2day')).to.equal(172800000);
      assume(Tick.parse('2days')).to.equal(172800000);
    });

    it('should convert s to ms', function () {
      assume(Tick.parse('1s')).to.equal(1000);
      assume(Tick.parse('1sec')).to.equal(1000);
      assume(Tick.parse('1secs')).to.equal(1000);
      assume(Tick.parse('1second')).to.equal(1000);
      assume(Tick.parse('1seconds')).to.equal(1000);
    });

    it('should convert ms to ms', function () {
      assume(Tick.parse('100ms')).to.equal(100);
    });

    it('should work with decimals', function () {
      assume(Tick.parse('1.5h')).to.equal(5400000);
    });

    it('should work with multiple spaces', function () {
      assume(Tick.parse('1   s')).to.equal(1000);
    });

    it('should return 0 if invalid', function () {
      assume(Tick.parse('Hello mom')).to.equal(0);
    });

    it('should be case-insensitive', function () {
      assume(Tick.parse('1.5H')).to.equal(5400000);
    });

    it('should work with numbers starting with .', function () {
      assume(Tick.parse('.5ms')).to.equal(0.5);
    });
  });

  describe('#setInterval', function () {
    it('adds a setInterval', function (next) {
      var start = Date.now()
        , i = 0;

      tock.setInterval('test', function () {
        var taken = Date.now() - start;

        assume(this).equals(tock);

        if (i === 0) {
          assume(taken).is.above(5);
          assume(taken).is.below(15);
        } else {
          next();
        }

        i++;
      }, 10);
    });

    it('can be called with a custom context', function (next) {
      var tock = new Tick(context);

      tock.setInterval('test', function () {
        assume(this).deep.equals(context);
        tock.clear();

        next();
      }, 10);
    });

    it('accepts strings for time', function (next) {
      var start = Date.now()
        , i = 0;

      tock.setInterval('test', function () {
        var taken = Date.now() - start;

        if (i === 0) {
          assume(taken).is.above(5);
          assume(taken).is.below(15);
        } else {
          next();
        }

        i++;
      }, '10 ms');
    });

    it('run with the same timeout if a known name is provided', function (next) {
      var start = Date.now()
        , j = 0
        , i = 0;

      tock.setInterval('test', function () {
        j++;
      }, '100 ms');

      setTimeout(function () {
        tock.setInterval('test', function () {
          i++;

          if (i === 10) {
            assume(j).equals(i);
            next();
          }
        }, '100 ms');
      }, 20);
    });
  });

  describe('#setTimeout', function () {
    it('adds a setTimeout', function (next) {
      var start = Date.now();

      tock.setTimeout('test', function () {
        var taken = Date.now() - start;
        assume(this).deep.equals(tock);

        assume(taken).is.above(5);
        assume(taken).is.below(15);

        next();
      }, 10);
    });

    it('can be called with a custom context', function (next) {
      var tock = new Tick(context);

      tock.setTimeout('test', function () {
        assume(this).deep.equals(context);
        tock.clear();

        next();
      }, 10);
    });

    it('accepts strings for time', function (next) {
      var start = Date.now();

      tock.setTimeout('test', function () {
        var taken = Date.now() - start;

        assume(taken).is.above(5);
        assume(taken).is.below(15);

        next();
      }, '10 ms');
    });

    it('run with the same timeout if a known name is provided', function (next) {
      var start = Date.now();

      tock.setTimeout('test', function () {
        var taken = Date.now() - start;

        assume(taken).is.above(95);
        assume(taken).is.below(110);
      }, '100 ms');

      setTimeout(function () {
        tock.setTimeout('test', function () {
          var taken = Date.now() - start;

          assume(taken).is.above(95);
          assume(taken).is.below(110);

          next();
        }, '100 ms');
      }, 20);
    });
  });

  describe('#clear', function () {
    it('clears multiple timeouts', function (next) {
      tock.setTimeout('timer', fail, '1 second');
      tock.setTimeout('timer', fail, '1 second');
      tock.setTimeout('timers', fail, '10 ms');
      tock.setTimeout('timers', fail, 0);

      tock.clear('timer', 'timers');

      setTimeout(function () {
        next();
      }, 1010);
    });

    it('splits the string if only one argument is supplied', function (next) {
      tock.setTimeout('timer', fail, '1 second');
      tock.setTimeout('timer', fail, '1 second');
      tock.setTimeout('timers', fail, '10 ms');
      tock.setTimeout('timers', fail, 0);

      tock.clear('timer, timers, non-existing');

      setTimeout(function () {
        next();
      }, 1010);
    });

    it('clears all if no arguments are supplied', function (next) {
      tock.setTimeout('timer', fail, '1 second');
      tock.setTimeout('timer', fail, '1 second');
      tock.setTimeout('timers', fail, '10 ms');
      tock.setTimeout('timers', fail, 0);

      tock.clear();

      setTimeout(function () {
        next();
      }, 1010);
    });
  });

  describe('#active', function () {
    it('returns true if a timer is defined', function () {
      assume(tock.active('foo')).is.false();

      tock.setTimeout('foo', function () {});
      assume(tock.active('foo')).is.true();

      tock.clear();
      assume(tock.active('foo')).is.false();
    });
  });

  describe('#adjust', function () {
    it('adjusts nothing for unknown timers', function () {
      tock.adjust('foo', '1 second');
    });

    it('adjusts the timeout', function (next) {
      tock.setTimeout('timer', fail, '10 ms');
      tock.adjust('timer', '1 second');

      setTimeout(function () {
        tock.clear();
        next();
      }, 500);
    });

    it('adjusts the interval', function (next) {
      var ticked = false;

      tock.setInterval('foo', function () {
        var spend = Date.now() - start;

        if (spend < 30) {
          tock.adjust('foo', '100 ms');
          ticked = true;
        } else if(spend < 150) {
          if (!ticked) throw new Error('I should have ticked');
          tock.clear();
          next();
        }

        start = Date.now();
      });

      var start = Date.now();
    });
  });

  describe('#end', function () {
    it('returns true when its cleared the first time', function () {
      assume(tock.end()).is.true();
    });

    it('returns false when already cleared', function () {
      assume(tock.end()).is.true();
      assume(tock.end()).is.false();
    });
  });
});
