/*
Demo of (only) the `getEntries()` and `getMatchesForString()` functions
of `DictionaryLocal`, using the data in `demoData.js`.

Just run: `node demoInNode.js`.
*/


/* eslint-disable no-console */


// With Node.js, we can import `VsmDictionaryLocal` with `require()`.
// We require() the package that is exposed in the project's root folder.
const VsmDictionaryLocal = require('..');


runDemo();


var dict;

function runDemo() {
  console.log('\n=== This is a basic demo of (only)' +
    '\n=== the `getEntries()` and `getMatchesForString()` functions' +
    '\n=== of `VsmDictionaryLocal`, using demo data from demoData.js.');

  const demoData = require('./demoData');
  dict = new VsmDictionaryLocal(demoData);
  demo1();
}



function demo1() {
  console.log('\n--- VsmDictionaryLocal entries sample:');
  dict.getEntries({ filter: { dictID: ['BIO'] }, perPage: 5 },  function(err, res) {
    console.dir(res.items, {depth: 4});
    console.log(dict.entries.length + ' entries total.');
    demo2();
  });
}



function demo2() {
  var str = 'in';
  console.log('\n--- VsmDictionaryLocal match-objects for \'' + str + '\':');

  var options = { perPage: 10 };
  dict.getMatchesForString(str, options, function (err, res) {
    showOutput(err, res, demo3);
  });
}



function demo3() {
  var str = 'in';
  var dictID = 'BIO';
  console.log('\n--- VsmDictionaryLocal match-objects for \'' + str + '\', ' +
    'with dictID-filter for \'' + dictID + '\':');

  var options = { perPage: 10,  filter: {dictID: [dictID]} };
  dict.getMatchesForString(str, options, function (err, res) {
    showOutput(err, res, done);
  });
}



function done() {
}



function showOutput(err, res, cb) {
  if (err)  console.log('Error: ' + err);
  else {
    for (var i = 0; i < res.items.length; i++) {
      console.log( matchToString(res.items[i]) );
    }
  }
  cb();
}



function matchToString(m) {
  var arr = [
    'type:\''   + m.type,
    'dictID:\'' + m.dictID,
    'id:\''     + m.id,
    'str:\''    + m.str,
  ];
  if (m.style)  arr.push('style:\'' + m.style);
  if (m.descr)  arr.push('descr:\'' + m.descr);
  if (m.z)  arr.push('z:\'' + JSON.stringify(m.z));
  if (m.terms)  arr.push('terms:' + JSON.stringify(m.terms)
    .replace(/"str"/g, 'str') .replace(/"style"/g, 'style')
    .replace(/"descr"/g, 'descr'));

  return '{' + arr.join('\', ') + '}';
}


/* eslint-enable no-console */
