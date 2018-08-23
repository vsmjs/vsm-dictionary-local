const { callAsync, callAsyncFor } = require('./async');
const sinon = require('sinon');
const chai = require('chai');  chai.should();
const expect = chai.expect;


describe('helpers/async.js', () => {
  describe('callAsync()', () => {
    var f = (a, b, cb) => cb(null, a * b);
    var count;

    beforeEach(() => {
      count = 0;
    });

    it('calls a function on the next event loop', cb => {
      var delay = 0;
      callAsync(f, delay, 2, 5, (err, ans) => {
        ans.should.equal(10);
        count.should.equal(1);
        cb();
      });
      count = 1;  // `f` will only be called after this assignment.
    });


    describe('with custom delay', () => {
      var clock;  // See https://stackoverflow.com/questions/17446064

      beforeEach(() => {
        clock = sinon.useFakeTimers();
      });

      afterEach(() => {
        clock.restore();
      });

      it('calls a function on the next event loop with zero delay, ' +
         'if an invalid delay value was given', cb => {
        var delay = -100;
        callAsync(f, delay, 2, 5, (err, ans) => {
          ans.should.equal(10);
          count.should.equal(1);
          count = 2;
        });
        count = 1;
        clock.tick(0);
        count.should.equal(2);
        cb();
      });

      it('calls a function after a given delay value', cb => {
        var delay = 200;
        callAsync(f, delay, 2, 5, (err, ans) => {
          ans.should.equal(10);
          count.should.equal(1);
          count = 2;
        });
        count = 1;
        clock.tick(199);
        count.should.equal(1);  // `f` was not called yet.
        clock.tick(1);
        count.should.equal(2);  // `f` has been called now.
        cb();
      });

      it('calls a function after a given delay range', cb => {
        var delay = [300, 500];
        callAsync(f, delay, 2, 5, (err, ans) => {
          ans.should.equal(10);
          count.should.equal(1);
          count = 2;
        });
        count = 1;
        clock.tick(299);
        count.should.equal(1);
        clock.tick(201);
        count.should.equal(2);
        cb();
      });
    });
  });


  describe('callAsyncFor()', () => {
    var f = x => x == 0 ? ['e', undefined] : [null, x * 10];
    var delay = 0;
    var count;

    beforeEach(() => {
      count = 0;
    });

    it('calls `f` on an array, without error; ' +
       'and calls back on the next event-loop', cb => {
      callAsyncFor([1, 2], f, delay, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal([10, 20]);
        count.should.equal(1);
        cb();
      });
      count = 1;
    });
    it('calls `f` on an array, including an error; ' +
       'and calls back on the next event-loop', cb => {
      callAsyncFor([0, 1, 2], f, delay, (err, res) => {
        err.should.deep.equal(['e', null, null]);
        res.should.deep.equal([undefined, 10, 20]);
        count.should.equal(1);
        cb();
      });
      count = 1;
    });
    it('also for an empty array, ' +
       'calls the callback on the next event-loop', cb => {
      callAsyncFor([], f, delay, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal([]);
        count.should.equal(1);
        cb();
      });
      count = 1;
    });
  });
});
