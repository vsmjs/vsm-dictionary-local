/*
Design specification: see DictionaryLocal.spec.md.
*/
const Dictionary = require('vsm-dictionary');
const callAsync    = require('./helpers/async').callAsync;
const callAsyncFor = require('./helpers/async').callAsyncFor;
const { deepClone, strcmp, arrayQuery } = require('./helpers/util');

const msgAbsentDictInfo = s => `dictInfo for '${s}' does not exist`;
const msgAbsentEntry    = s =>    `entry for '${s}' does not exist`;
const msgAbsentRefTerm  = s =>      `refTerm '${s}' does not exist`;
const msgNoSuchDictID   = s => `entry is linked to non-existent dictID '${s}'`;
const perPageDefault = 20;
const perPageMax     = 100;


module.exports = class DictionaryLocal extends Dictionary {

  constructor(options) {
    var opt = options || {};
    super(opt);

    this.dictInfos = [];
    this.entries = [];
    this.refTerms = [];

    if (opt.dictData || opt.refTerms) {
      var errs = this.addDictionaryData(opt.dictData || [], opt.refTerms);
      if (errs)  throw errs;
    }

    this.perPageDefault = opt.perPageDefault || perPageDefault;
    this.perPageMax     = opt.perPageMax     || perPageMax;

    this.delay = opt.delay || 0;
  }


  // --- ADD/UPDATE/DELETE AN ARRAY OF DICTINFOS/ENTRIES/REFTERMS ---
  // These functions let single-element-based sister-functions do the real work.
  // - The sister-functions are synchronous and all return a 1-or-2-element
  //   array: `[error]` or `[error, result]`.
  // - The functions here call them in a loop, wrapped in an async callback.

  addDictInfos(dictInfos, cb) {
    callAsyncFor(dictInfos, this._addDictInfo.bind(this), this.delay,
      this._cbDict(cb));
  }

  updateDictInfos(dictInfos, cb) {
    callAsyncFor(dictInfos, this._updateDictInfo.bind(this), this.delay,
      this._cbDict(cb));
  }

  deleteDictInfos(dictIDs, cb) {
    callAsyncFor(dictIDs, this._deleteDictInfo.bind(this), this.delay, cb);
  }


  addEntries(entries, cb) {
    callAsyncFor(entries, this._addEntry.bind(this), this.delay,
      this._cbEntr(cb));
  }

  updateEntries(entryLikes, cb) {
    callAsyncFor(entryLikes, this._updateEntry.bind(this), this.delay,
      this._cbEntr(cb));
  }

  deleteEntries(conceptIDs, cb) {
    callAsyncFor(conceptIDs, this._deleteEntry.bind(this), this.delay, cb);
  }


  addRefTerms(refTerms, cb) {
    callAsyncFor(refTerms, this._addRefTerm.bind(this), this.delay, cb);
  }

  deleteRefTerms(refTerms, cb) {
    callAsyncFor(refTerms, this._deleteRefTerm.bind(this), this.delay, cb);
  }


  _cbDict(cb) {  // Gets called after every set of dictInfo-changing operations.
    return (...args) => { this._sortDictInfos();  cb(...args) };
  }


  _cbEntr(cb) {
    return (...args) => { this._sortEntries();  cb(...args) };
  }



  setDelay(delay) {  // Use a new `delay` value.
    this.delay = delay || 0;
  }



  // --- CONVENIENT SYNCHRONOUS ADDING OF DICTINFOS+ENTRIES+REFTERMS ---

  addDictionaryData(dictData = [], refTerms = []) {
    var errs = [];
    var err;
    dictData.forEach(dict => {
      err = this._addDictInfo(dict)[0];
      if (err)  err = this._updateDictInfo(dict)[0];
      if (err)  errs.push(err);

      (dict.entries || []) .forEach(e => {
        if (!e.dictID)  e.dictID = dict.id; // Fill in any omitted entry.dictID.
        else if (e.dictID !== dict.id) {
          return errs.push(`an entry tries to override dictID '${dict.id}'`);
        }

        err = this._addEntry(e)[0];
        if (err && err.endsWith('already exists')) {
          err = this._updateEntry(e)[0];
        }
        if (err)  errs.push(err);
      });
    });
    this._sortEntries();
    refTerms.forEach(s => {
      err = this._addRefTerm(s)[0];
      if (err)  errs.push(err);
    });
    return !errs.length ? null : errs;
  }



  // --- ADD/UPDATE/DELETE SINGLE DICTINFO ---

  _addDictInfo(di) {
    if (!di.id) {
      return ['dictInfo misses a required property: id'];
    }
    if (this._indexOfDictInfo(di.id) >= 0) {
      return [`dictInfo for '${di.id}' already exists`];
    }

    // Copy props, but omit invalid ones.
    var dictInfo = { id: di.id };                 // Required prop.
    if (di.abbrev)  dictInfo.abbrev = di.abbrev;  // Optional prop.
    if (di.name  )  dictInfo.name   = di.name;    // Opt.

    this.dictInfos.push(dictInfo);
    return [null];
  }


  _updateDictInfo(di) {
    var index = this._indexOfDictInfo(di.id);
    if (index < 0)  return [msgAbsentDictInfo(di.id), null];

    var di2 = Object.assign({}, this.dictInfos[index]);  // Clone it.
    if (di.abbrev)  di2.abbrev = di.abbrev;
    if (di.name  )  di2.name   = di.name;

    this.dictInfos[index] = di2;
    return [null, di2];
  }


  _deleteDictInfo(id) {
    var index = this._indexOfDictInfo(id);
    if (index < 0)  return [msgAbsentDictInfo(id)];

    if (this.entries.find(e => e.dictID == id)) {
      return [`dictInfo for '${id}' still has associated entries`];
    }
    this.dictInfos.splice(index, 1);
    return [null];
  }


  _indexOfDictInfo(dictID) {  // Returns `-1` if not found.
    return this.dictInfos.findIndex(di => di.id == dictID);
  }


  _sortDictInfos() {
    this.dictInfos.sort((a, b) => strcmp(a.id, b.id));
  }



  // --- ADD/UPDATE/DELETE SINGLE ENTRY ---

  _addEntry(entry) {
    if (!entry.id || !entry.dictID || !entry.terms ||
        (Array.isArray(entry.terms) && !entry.terms.length)) { // `terms` != [].
      return ['entry misses a required property: id, dictID, or terms'];
    }

    var di = this.dictInfos[ this._indexOfDictInfo(entry.dictID) ];
    if (!di)  return [msgNoSuchDictID(entry.dictID)];

    if (this._indexOfEntry(entry.id) >= 0) {
      return [`entry for '${entry.id}' already exists`];
    }

    entry = Dictionary.prepEntry(entry);
    if (entry.terms.filter(t => !t.str).length)  return ['invalid term'];
    if (entry.z)  entry.z = deepClone(entry.z);

    this.entries.push(entry);
    return [null];
  }


  _updateEntry(entryLike) {
    var index = this._indexOfEntry(entryLike.id);
    if (index < 0)  return [msgAbsentEntry(entryLike.id), null];

    if (entryLike.dictID  &&  this._indexOfDictInfo(entryLike.dictID) < 0) {
      return [msgNoSuchDictID(entryLike.dictID), null];
    }

    var entry = deepClone(this.entries[index]);
    if (entryLike.dictID)  entry.dictID = entryLike.dictID;
    if (entryLike.descr )  entry.descr  = entryLike.descr;

    // Delete as needed any items from `terms`, and properties from `z`.
    if (entryLike.termsDel)  entry.terms = entry.terms.filter(
      term => !entryLike.termsDel.includes(term.str)
    );

    if (entryLike.zDel && entry.z) {
      if (entryLike.zDel === true)  delete entry.z;
      else  entryLike.zDel.forEach(key => delete entry.z[key]);
    }

    // Replace(-if-exists) or add, termObjects in `terms`.
    var terms = Dictionary.prepTerms( entryLike.terms || [] );
    terms.forEach(t => {
      var j = entry.terms.findIndex(t2 => t2.str == t.str);
      if (j >= 0)  entry.terms[j] = t;
      else  entry.terms.push(t);
    });
    if (!entry.terms.length)  return ['entry would have no terms left', null];

    // Replace-if-exists, or add, properties in `z`.
    if (entryLike.z) {
      entry.z = Object.assign( entry.z || {},  deepClone(entryLike.z) );
    }

    return [null, this.entries[index] = entry];
  }


  _deleteEntry(id) {
    var index = this._indexOfEntry(id);
    if (index < 0)  return [msgAbsentEntry(id)];
    this.entries.splice(index, 1);
    return [null];
  }


  _indexOfEntry(conceptID) {  // Returns `-1` if not found.
    return this.entries.findIndex(entry => entry.id == conceptID);
  }


  _sortEntries() {  // Sorts the 'entries' by `dictID` and then by `id`.
    this.entries.sort(
      (a, b) => strcmp(a.dictID, b.dictID) || strcmp(a.id, b.id) );
  }



  // --- ADD/DELETE SINGLE REFTERM ---

  _addRefTerm(refTerm) {
    if (!refTerm)  return ['empty refTerm'];
    this.refTerms = [...new Set(this.refTerms.concat(refTerm))].sort();
    return [null];
  }


  _deleteRefTerm(refTerm) {
    var index = this.refTerms.indexOf(refTerm);
    if (index < 0)  return [msgAbsentRefTerm(refTerm)];
    this.refTerms.splice(index, 1);
    return [null];
  }



  // --- "GET" FOR DICTINFOS/ENTRIES/REFTERMS ---

  getDictInfos(options, cb) {
    var o = Object.assign({ filter: {} }, options);

    var filter = di => !o.filter.id || o.filter.id.includes(di.id);

    var sort = (a, b) => strcmp(a.id, b.id);  // Default: sort by `id`.

    var arr = this._arrayQuery(this.dictInfos, filter, sort, o.page, o.perPage);
    callAsync(cb, this.delay, null, { items: arr });
  }


  getEntries(options, cb) {
    var o = Object.assign({ filter: {} }, options);

    var filter = e =>
      (!o.filter.id     || o.filter.id    .includes(e.id    )) &&
      (!o.filter.dictID || o.filter.dictID.includes(e.dictID));

    var sort =
      o.sort == 'id' ?                               /* eslint-disable indent */
        (a, b) => strcmp(a.id, b.id) :
      o.sort == 'str' ?  // --> First sort entries by their first term-string.
        (a, b) => strcmp(a.terms[0].str, b.terms[0].str) ||
                  strcmp(a.dictID, b.dictID) || strcmp(a.id, b.id) :
        (a, b) => strcmp(a.dictID, b.dictID) || strcmp(a.id, b.id); // =Default.
                                                      /* eslint-enable indent */

    var arr = this._arrayQuery(this.entries, filter, sort, o.page, o.perPage);
    callAsync(cb, this.delay, null, { items: Dictionary.zPropPrune(arr, o.z) });
  }


  getRefTerms(options, cb) {
    var o = Object.assign({ filter: {} }, options);

    var filter = s => !o.filter.str || o.filter.str.includes(s);
    var sort = (a, b) => strcmp(a, b);

    var arr = this._arrayQuery(this.refTerms, filter, sort, o.page, o.perPage);
    callAsync(cb, this.delay, null, { items: arr });
  }


  _arrayQuery(array, filter, sort, page, perPage) {
    return arrayQuery(
      array, filter, sort, page, perPage, this.perPageDefault, this.perPageMax);
  }



  // --- SEARCH BY STRING: "GET MATCHES" FOR ENTRIES ---

  getEntryMatchesForString(searchStr, options, cb) {
    var o = Object.assign({ filter: {}, sort: {} }, options);

    var arr = [];
    var str = searchStr.toLowerCase();

    if (str) {
      // Build an array with just enough information for filtering and sorting
      // with arrayQuery(). It needs an item for _each_ term-str with its linked
      // entry. So, strings and entries can appear multiple times in the array.
      this.entries.forEach(e => {
        e.terms.forEach((t, p) => {  // `p`: term's position in `e.terms`.
          arr.push({str: t.str, dictID: e.dictID, e, p, id: e.id});
        });
      });

      // - Prepare filter for keeping only certain dictIDs, and string-matches.
      // - And for the ones we keep, we store the match-type in `type`;
      //   and we already add a field `D` = 'is-dictID-in-o.sort.dictID'
      //   for sorting in the next step.
      var filter = x => {
        if (o.filter.dictID && !o.filter.dictID.includes(x.dictID)) return false;
        if (     x.str.toLowerCase().startsWith(str))  x.type = 'S';
        else if (x.str.toLowerCase().includes  (str))  x.type = 'T';
        else return false;
        x.D = o.sort.dictID && o.sort.dictID.includes(x.dictID) ? 0: 1;
        return true;
      };

      // Prepare for sorting by 'is-dictID-in-o.sort.dictID', then S- vs. T-type,
      // then alphabetically by term-string, then by dictID. Then by the term's
      // pos in the synonym list (=> first-term matches first), then conceptID.
      var sort = (a, b) =>
        a.D - b.D || strcmp(a.type, b.type) || strcmp(a.str, b.str) ||
        strcmp(a.dictID, b.dictID) || a.p - b.p || strcmp(a.id, b.id);

      // Apply query, then replace each remaining item by a full 'match'-type
      // object, having: entry's `id/dictID/terms/z`,
      // term-object's `str/style/descr`, and match-type `type`.
      arr = this._arrayQuery(arr, filter, sort, o.page, o.perPage)
        .map(x => Object.assign( {},  x.e,  x.e.terms[x.p],  {type: x.type} ));
      arr = Dictionary.zPropPrune(arr, o.z);
    }

    callAsync(cb, this.delay, null, { items: arr });
  }

};
