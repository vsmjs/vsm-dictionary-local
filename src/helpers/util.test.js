const { deepClone, strcmp, limitBetween, randomFromInterval, arrayQuery }
  = require('./util');
const chai = require('chai');  chai.should();
const expect = chai.expect;


describe('helpers/util.js', () => {
  describe('deepClone()', () => {
    it('deep-clones, so changes on the original object ' +
       'do not affect the clone', () => {
      var x = { a: 1,  b: {c: 1} };
      var y = deepClone(x);
      y.b.c = 2;
      x.should.deep.equal({ a: 1,  b: {c: 1} });
      y.should.deep.equal({ a: 1,  b: {c: 2} });
    });
  });

  describe('strcmp()', () => {
    it('returns -1;0;1 after case-insensitively comparing <;==;> ' +
       'strings', () => {
      expect(strcmp('a', 'b')).to.equal(-1);
      expect(strcmp('a', 'a')).to.equal(0);
      expect(strcmp('b', 'a')).to.equal(1);
      expect(strcmp('B', 'a')).to.equal(1);
      expect(strcmp('B', 'a', true)).to.equal(-1);
    });
    it('is usable as a sort-function', () => {
      ['c','B','a'].sort((a, b) => strcmp(a, b))
        .should.deep.equal(['a','B','c']);
    });
  });

  describe('limitBetween()', () => {
    it('limits the 1st argument to be >= the 2nd and <= 3rd', () => {
      limitBetween(2, 1, 3).should.equal(2);
      limitBetween(0, 1, 3).should.equal(1);
      limitBetween(4, 1, 3).should.equal(3);
    });
    it('limits the 1st argument to only be >= the 2nd, ' +
       'if the 3rd is `null`', () => {
      limitBetween(0, 1, null).should.equal(1);
      limitBetween(4, 1, null).should.equal(4);
    });
    it('limits the 1st argument to only be <= the 3nd, ' +
       'if the 2nd is `null`', () => {
      limitBetween(0, null, 3).should.equal(0);
      limitBetween(4, null, 3).should.equal(3);
    });
  });

  describe('randomFromInterval()', () => {
    it('for a single value, returns that value', () => {
      randomFromInterval(100).should.equal(100);
    });
    it('for an array, returns a number within the given bounds', () => {
      var nr = randomFromInterval([100, 200]);
      (nr >= 100).should.equal(true);
      (nr <= 200).should.equal(true);
    });
    it('for an array, corrects invalid bounds', () => {
      randomFromInterval([200, 100]).should.equal(200);
    });
  });

  describe('arrayQuery()', () => {
    var arr = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    var filter  = e => e < 7;
    var filter2 = e => e > 3;
    var sort = (a, b) => a%2 - b%2 || a - b; // Sort by: even vs odd, then value.
    it('applies a given sort function', () => {
      arrayQuery(arr, filter , sort).should.deep.equal([2, 4, 6, 1, 3, 5]);
      arrayQuery(arr, filter2, sort).should.deep.equal([4, 6, 8, 5, 7, 9]);
    });
    it('applies a filter and sort function, and paginates, page 1', () => {
      arrayQuery(arr, filter , sort, 1, 3).should.deep.equal([2, 4, 6]);
      arrayQuery(arr, filter2, sort, 1, 3).should.deep.equal([4, 6, 8]);
    });
    it('applies a filter and sort function, and paginates, page 2', () => {
      arrayQuery(arr, filter , sort, 2, 3).should.deep.equal([1, 3, 5]);
      arrayQuery(arr, filter2, sort, 2, 3).should.deep.equal([5, 7, 9]);
    });
    it('rounds up invalid pagination arguments to 1', () => {
      arrayQuery(arr, filter, sort, -1, -1).should.deep.equal([2]);
    });
  });
});
