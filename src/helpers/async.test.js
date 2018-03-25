const {asyncMap, callAsync, callAsyncForOneOrEach} = require('./async');
const sinon = require('sinon');
const chai = require('chai');  chai.should();
const expect = chai.expect;


describe('helpers/async.js', function() {
  describe('asyncMap()', function() {
    var f = (x, cb) => x == 0 ? cb('err') : cb(null, x * 10); // Error for x==0.

    it('calls back with two arrays: null/error-values, and results-values, ' +
      'as received back from each of the function calls', function(cb) {
      asyncMap([0, 1, 2], f, (err, res) => {
        err.should.deep.equal(['err', null, null]);
        res.should.deep.equal([undefined, 10, 20]);
        cb();
      });
    });
    it('calls back with one `null` as \'err\' ' +
      'if none of the calls reported an error', function(cb) {
      asyncMap([1, 2], f, (err, res) => {
        expect(err).to.deep.equal(null);
        res.should.deep.equal([10, 20]);
        cb();
      });
    });
  });


  describe('callAsync()', function() {
    var f = (a, b, cb) => cb(null, a * b);
    var count;

    beforeEach(function() {
      count = 0;
    });

    it('calls a function on the next event loop', function(cb) {
      var delay = 0;
      callAsync(f, delay, 2, 5, (err, ans) => {
        ans.should.equal(10);
        count.should.equal(1);
        cb();
      });
      count = 1;  // `f` will only be called after this assignment.
    });


    describe('with custom delay', function() {
      var clock;  // See https://stackoverflow.com/questions/17446064

      beforeEach(function() {
        clock = sinon.useFakeTimers();
      });

      afterEach(function() {
        clock.restore();
      });

      it('calls a function on the next event loop with zero delay, ' +
        'if an invalid delay value was given', function(cb) {
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

      it('calls a function after a given delay value', function(cb) {
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

      it('calls a function after a given delay range', function(cb) {
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


  describe('callAsyncForOneOrEach()', function() {
    var f = (x, cb) => x==0 ? cb('e') : cb(null, x * 10);
    var delay = 0;
    var count;

    beforeEach(function() {
      count = 0;
    });

    it('calls `f` on a single value, without error; ' +
      'and calls back on the next event-loop', function(cb) {
      callAsyncForOneOrEach(1, f, delay, (err, res) => {
        expect(err).to.equal(null);
        res.should.equal(10);
        count.should.equal(1);
        cb();
      });
      count = 1;
    });
    it('on single value, and reports error', function(cb) {
      callAsyncForOneOrEach(0, f, delay, (err, res) => {
        err.should.equal('e');
        expect(res).to.equal(undefined);
        count.should.equal(1);  // Test each call's true asynchronicity as well.
        cb();
      });
      count = 1;
    });
    it('on multiple values in array, without errors', function(cb) {
      callAsyncForOneOrEach([1, 2], f, delay, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal([10, 20]);
        count.should.equal(1);
        cb();
      });
      count = 1;
    });
    it('on multiple values in array, including an error', function(cb) {
      callAsyncForOneOrEach([0, 1, 2], f, delay, (err, res) => {
        err.should.deep.equal(['e', null, null]);
        res.should.deep.equal([undefined, 10, 20]);
        count.should.equal(1);
        cb();
      });
      count = 1;
    });
    it('calls the callback on the next event-loop, also for an empty array',
      function(cb) {
      callAsyncForOneOrEach([], f, delay, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal([]);
        count.should.equal(1);
        cb();
      });
      count = 1;
    });
  });
});
