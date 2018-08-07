module.exports = { callAsync, callAsyncFor };

const { randomFromInterval } = require('./util');


/**
 * Makes a call to `f` with given arguments, in a truly asynchronous way,
 * i.e. on the next event-loop; and with a custom delay in milliseconds.
 */
function callAsync(f, delay, ...args) {
  delay = randomFromInterval(delay);
  setTimeout(() => f(...args), delay);
}


/**
 * - Waits for a custom `delay` in milliseconds, or at least until the next
 *   event-loop starts, before starting to process; this makes the final call
 *   to `cb` happen in a guaranteed truly asynchronous way;
 * - then calls the *synchronous* function `func(item)` for each item in the
 *   given `elems` array;
 * - hereby collects what each call returns (as a 1-or-2-element array
 *   `[error, result]`), into two arrays: `errors` and `results`;
 * - then makes `errors` simply `null` if all errors were `null`;
 * - and finally, calls `cb` with arguments `(errors, results)`,
 */
function callAsyncFor(elems, func, delay, cb) {
  var errors  = [];
  var results = [];

  callAsync(
    () => {
      elems.forEach(e => {
        var arr = func(e);
        errors .push(arr[0]);
        results.push(arr[1]);
      });
      cb(errors.every(err => err === null) ? null : errors,  results);
    },
    delay
  );
}
