module.exports = {asyncMap, callAsync, callAsyncEach};


/**
 * The function `asyncMap(elems, func, cb)` executes, in parallel, a call
 * to `func(item, callback(error, result))` for every item of the `elems` array,
 * and calls `cb(errors, results)` when all of their callbacks have been called.
 *
 * In contrast to npm's "async"'s `map` function, this function does not stop
 * if any of the `func`-calls reports an error (via its callback). It returns
 * an array of null/error for each of the calls, or simply `null` if no errors.
 *
 * - `results` is an array of the `results` returned via each `callback`;
 * - `errors`:
 *   - if any of the `callback`s returned a non-null `error`,
 *     then `errors` is an array of all the reported `error` values,
 *     in the order corresponding to the given `elems`.
 *   - if all of them were `null`, then `errors` is simply `null` (not array).
 */
function asyncMap(elems, func, cb) {
  var results = [];
  var errors = [];
  var count = elems.length;

  if (!count)  return cb(null, results);

  elems.forEach((e, i) =>
    func(e, (error, result) => {
      errors[i] = error;
      results[i] = result;
      if (!--count)  cb(
        errors.every(err => err === null) ? null : errors,
        results
      );
    })
  );
}


/**
 * If given a range (array) of two numbers, a random value in that range;
 * if given a positive number, returns it;
 * else returns 0.
 */
function _getDelayNumber(delay) {
  if(Array.isArray(delay)  &&  delay.length >= 2) {
    var min = Math.max(+delay[0], 0);
    var max = Math.max(+delay[1], min);
    return min + (Math.random() * (max - min))
  }
  else  return Math.max(+delay, 0);
}



/**
 * Makes a call to `f` with given arguments, in a truly asynchronous way,
 * i.e. on the next event-loop; and with a custom delay in milliseconds.
 */
function callAsync(f, delay, ...args) {
  delay = _getDelayNumber(delay);
  setTimeout(() => f(...args), delay);
}


/**
 * - For the given `elems` array:
 *   - calls `func(item, tmpCb)` for each item,
 *   - collects all what `func` returns via its calls to tmpCb(error, result)`,
 *     into two arrays: `errors` and `results`;
 *   - and finally, calls `cb` with `(errors, results)`,
 *     after making `errors` simply `null` if all errors were `null`.
 * - Moreover, it makes this happen in a in a guaranteed truly asynchronous way:
 *   it calls `func` on next event-loops, or if `func` is never called (when
 *   elems is an empty array), then calls `cb` on the next event-loop instead;
 *   and with a custom delay in milliseconds (same delay value for all elems).
 */
function callAsyncEach(elems, func, delay, cb) {
  delay = _getDelayNumber(delay);

  if (!elems.length)  makeAsync(cb)(null, []);  // If no elems, still call `cb`.
  else  asyncMap(elems, (e, cbf) => makeAsync(func)(e, cbf), cb);

  function makeAsync(cb) {
    return (...args) => callAsync(cb, delay, ...args);
  }
}
