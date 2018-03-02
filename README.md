# vsm-dictionary-local

<br>

## Summary

`vsm-dictionary-local` is a full, local (=in-memory) implementation
of the 'VsmDictionary' parent-class/interface (from the package
[`vsm-dictionary`](https://github.com/vsmjs/vsm-dictionary)).

<br>

## Background

- [VSM-sentences](http://scicura.org/vsm/vsm.html)
  are built from terms that are linked to identifiers.
- The '[`vsm-dictionary`](https://github.com/vsmjs/vsm-dictionary)'
  package defines a standardized interface,
  for VSM-related tools to communicate with services
  that provide terms+IDs (e.g. a webserver API).
- It also includes the small 'VsmDictionary' parent class (/interface) that
  provides shared functionality for concrete subclasses (like this package).

<br>

## A local implementation of a VsmDictionary

This is VsmDictionaryLocal:

- It extends the VsmDictionary parent class, and provides
  a concrete implementation that fully implements the vsm-dictionary
  [specification](https://github.com/vsmjs/vsm-dictionary/blob/master/Dictionary.spec.md).
  - i.e. it has the complete Create, Read, Update, Delete, search,
    sort, filter, etc. functionality for terms, subdictionary-info objects, etc.
- It does not use an online server for data storage or lookup.
  Instead, it stores all data in-memory, as long as the application is running.

<br>

## When to use VsmDictionaryLocal

Because of the above,

- During the development of new tools that depend on a VsmDictionary,
  this module can be used as a fully functional placeholder
  that does not need an online server.
- Or, it could provide mock terms+ids while running
  standalone demos of VSM-sentence building tools.
- The many automated tests in VsmDictionaryLocal can give inspiration
  for testing future, webserver-connecting implementations.

<br>

## Specification

Apart from following the parent class
[specification](https://github.com/vsmjs/vsm-dictionary/blob/master/Dictionary.spec.md),
VsmDictionaryLocal follows the additional the spec described in
[DictionaryLocal.spec.md](DictionaryLocal.spec.md).  
&bull; <span style="font-size: smaller;">
(Note: we simply use the name 'DictionaryLocal' for VsmDictionaryLocal,
in the spec &amp; source code).</span>  

<br>

## Installation with NPM for Node.js:

```
npm install vsm-dictionary-local --save
```

<br>

## Example use

Example that (only):  
&nbsp;&bull; adds a dictionary-info object,  
&nbsp;&bull; adds entries (=concepts/IDs + terms),  
&nbsp;&bull; string-searches for matching terms:

```
const VsmDictionaryLocal = require('vsm-dictionary-local');

var dict = new VsmDictionaryLocal();
var dictInfo = {id: 'DictID_12', name: 'Example subdictionary'};
var entries = [
  {id: 'URI:001', dictID: 'DictID_12', terms: ['aaa', 'synonym']},
  {id: 'URI:002', dictID: 'DictID_12', terms: 'aab'},
  {id: 'URI:003', dictID: 'DictID_12', terms: 'abc', descr: 'description'}
];

dict.addDictInfos(dictInfo, (err) => {  // Add 1 subdictionary-info object.
  dict.addEntries(entries, (err) => {   // Add 3 entries.
    dict.getMatchesForString('ab', {}, (err, res) => {  // Query for string 'ab'.
      console.dir(res.items, {depth: 3});
    });
  });
});
```

This gives the output:

```
[ { id: 'URI:003',         // Concept-ID.
    dictID: 'DictID_12',   // Dictionary-ID.
    descr: 'description',  // Description of the meaning of concept `URI:003`.
    terms: [ { str: 'abc' } ],  // Term-objects: one term as an unstyled string.
    str: 'abc',            // The term-string that this match pertains to.
    type: 'S' },           // Match type. Prefix(S)-matches come before infix(T).
  { id: 'URI:002',
    dictID: 'DictID_12',
    terms: [ { str: 'aab' } ],
    str: 'aab',
    type: 'T' } ]
```

<br>
Or we can load all data in one synchronous call, by giving it to
VsmDictionaryLocal's constructor:

```
const VsmDictionaryLocal = require('vsm-dictionary-local');

// Create.
var dict = new VsmDictionaryLocal({
  dictData: [
    {id: 'DictID_12',  name: 'Example subdictionary', entries: [
      {id: 'URI:001', terms: ['aaa', 'synonym']},
      {id: 'URI:002', terms: 'aab'},
      {id: 'URI:003', terms: 'abc', descr: 'description'}
    ]},
  ],
});

// Query.
dict.getMatchesForString('ab', {}, (err, res) => {
  console.dir(res.items, {depth: 3});
});
```

which gives the same output.

<br>

## Tests

Run `npm test`, which runs tests with Mocha.  
Run `npm run testw`, which automatically reruns tests on any file change.

<br>

## Demo in Node.js

More examples are included in [demoInNode.js](demo/demoInNode.js)
(based on [demoData.js](demo/demoData.js)).  
Run it with: `node demo/demoInNode.js`.

<br>

## Interactive demo in the browser

Run `npm run demo` to start an interactive demo of (only)
the string-search functionality.  
This opens a browser page with an input-field to search
on [demoData.js](demo/demoData.js).

The demo works by making a Webpack dev-server bundle all source code 
(VsmDictionaryLocal and its dependencies) and serve it to the browser.