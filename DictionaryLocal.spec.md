DictionaryLocal.js
==================

Note: we simply use the name 'DictionaryLocal' for VsmDictionaryLocal.


&nbsp;  
INTRO
-----
`DictionaryLocal` is a local (=not on a remote server), in-memory implementation
and subclass of the `Dictionary` parent class.  
So it stores 'entry'-type objects that can represent any semantic 'concept',
through multiple synonyms ('terms'); it manages entries/terms of
possibly several domain-specific 'sub-dictionaries'; and it deals with any
extra info for these entries. This is all in support of
autocomplete-functionality for VSM-terms (vsm-autocomplete), among others.

In order to create a local dictionary in a convenient way, DictionaryLocal
provides some additional functionality.

Notes:
+ Callbacks are called in a truly asynchronous way (via `setTimeout(, 0)`,
  i.e. on the next event-loop) in order to show consistent,
  guaranteed-asynchronous behavior.  
  This makes this local VsmDictionary implementation behave in the exact same
  way as one that would interface with a remote server.
+ For basic data types and Get/Add/Update/Delete functionality:
  see the parent class `Dictionary`, where these concepts and functions are
  explained in detail.  
  In particular, `DictionaryLocal` stores data in, and manages access to,
  three arrays: `dictInfos`, `entries` (with 'entry'-type objects, as described
  in `Dictionary`), and `refTerms`.


&nbsp;  
CONSTRUCTOR OPTIONS
-------------------
The constructor takes an `options` Object with additional, optional properties:

- `dictData` and/or `refTerms`:  
    if given, these cause `addDictionaryData()` to be called, as described
    in detail further below.
- `perPageDefault` and `perPageMax`: both {Number}:  
    override the default behavior of how many items are returned per result-page
    (for dictInfos/entries/refTerms/matches) by default or maximum, respectively.
- `delay`: {Number|Array(Number)}: (default 0):  
    Adds a delay before calling any of its public, async methods' callbacks.
    This simulates interaction with a server more realistically.
    + If it is a number, the delay will be that amount of milliseconds.
    + If it is an array of two numbers, a minimum and a maximum value,
      then the delay will be a new random value in that range,
      for every async call-back.


&nbsp;  
ADDITIONAL 'ADD'-FUNCTIONALITY
------------------------------
+ `addDictionaryData(dictData, refTerms)` is a powerful convenience function.  
  It enables to add/update multiple subdictionaries's info and entries at once,
  and with a convenient simplification. It executes **synchronously**.
  - `dictData`: {Array(Object)}:  
            is a list of data objects, one for each to-add subdictionary:
    - a `dictInfo`-like object, but with *one added property*:
      - `entries` {Array(Object)}:
            these are normal (as described in VsmDictionary) 'entry'-type Objects,
            but:  
        + the  `dictID` property of these entries may be left away: then
          the dict-`id` from the surrounding `dictInfo`-like object is used;
  - `refTerms`: {Array(String)} (optional):  
            is a list of refTerms.<br><br>
  + All `dictData` will be processed internally and stored as standard 'dictInfo'
    and 'entry' objects, as they are described in the parent class `Dictionary`.
  + Any object (dictInfo or entry), is first attempted to be added;
    and if that gave an error, then the update function is tried for it instead.
  + Returns an array of collected errors (so, only the not-null ones),
    or simply `null` if there were none (so if that array would be empty).
  + One can create and fill a new DictionaryLocal in one go, by giving
    `dictData` and/or `refTerms` as properties to an `options` object when
    calling the constructor. That will automatically run `addDictionaryData()`.


&nbsp;  
ADDITIONAL OTHER FUNCTIONALITY
------------------------------
- `this.setDelay()` sets a new value for the delay or delay-range, which will
  be used from then onwards.


&nbsp;  
ADDITIONAL INTERNAL FUNCTIONALITY
---------------------------------
- `this.entries` are sorted by dictID, and then conceptID. This gives nice
  console-output when analyzing the contents of a DictionaryLocal.
