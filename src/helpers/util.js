module.exports =
  { deepClone, strcmp, limitBetween, randomFromInterval, arrayQuery };



/**
 * Returns a deep-clone of an object. (This excludes its functions).
 */
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}


/**
 * Compares strings, and returns a number (-1/0/1) that can be used by
 * compare functions used for sorting.
 */
function strcmp(a, b, caseMatters = false) {
  if (!caseMatters) {
    a = a.toLowerCase();
    b = b.toLowerCase();
  }
  return a < b ?  -1 :  a > b ?  1 :  0;
}


/**
 * If x is outside the interval [min, max], returns the border it's closest to.
 * If either min or max is null, it will be ignored.
 */
function limitBetween(x, min, max) {
  return (min != null && x < min) ? min : (max != null && x > max) ? max : x;
}


/**
 * If given an Array of two numbers, returns a random value in that range;
 * if given a positive number, returns it;
 */
function randomFromInterval(delay) {
  if (Array.isArray(delay)  &&  delay.length >= 2) {
    var min = Math.max(+delay[0], 0);
    var max = Math.max(+delay[1], min);
    return min + (Math.random() * (max - min));
  }
  else  return Math.max(+delay, 0);
}


/**
 * Provides a query-like interface to get elements from a given array,
 * based on `filter` and `sort` functions, and pagination settings.
 */
function arrayQuery(
  array, filter, sort, page, perPage, perPageDefault = 20, perPageMax = 100) {
  page    = limitBetween(page   || 1             , 1, null);
  perPage = limitBetween(perPage|| perPageDefault, 1, perPageMax);
  var skip = (page - 1) * perPage;
  return array
    .filter(filter)
    .sort  (sort)
    .slice (skip, skip + perPage);
}
