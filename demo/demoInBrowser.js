/*
NOTE!: This only works with Webpack.
Start the demo by running `npm run demo`.

The Webpack development-server bundles all modules, which are Node.js-based,
so they can run in the browser instead. The bundled JS-script will expose a
global variable `VsmDictionaryLocal` that can be accessed by this script.

Webpack serves the bundle in-memory (so, writing no files to disk), along with
an updated demo.html webpage that loads both that bundle and this demo-script.
*/


// In the browser, Webpack lets us access `VsmDictionaryLocal` as
// a global variable.
/* global VsmDictionaryLocal */  // Prevent ESLint error.
runDemo();


var matchesMaxCount = 20;


function runDemo() {
  // Remove the warning message of running this demo without Webpack.
  if (VsmDictionaryLocal)  document.getElementById('demo').innerHTML = '';

  // Load the data via a JSONP script, which will call `gotData()`.
  var script = document.createElement('script');
  script.src = 'demoData.js';
  document.getElementsByTagName('head')[0].appendChild(script);
}


function gotData(demoData) {  // eslint-disable-line no-unused-vars
  makeDemoLocal(demoData);
}



function makeDemoLocal(demoData) {
  var dict = new VsmDictionaryLocal(demoData);

  // Make an interactive demo panel, for querying it with string-search.
  var elems = createDemoPanel({
    title: 'VsmDictionaryLocal:<br> ' +
           '&nbsp; demo of (only) its \'getMatchesForString()\' function:<br>',
    //+'&nbsp;<span style="color:#777">(with no options or fixedTerms)</span>:',
    dictionary: dict,
    dictID: '',
    initialSearchStr: 'cd',
  });

  elems.input.focus();
  elems.input.setSelectionRange(0, elems.input.value.length);
}



function createDemoPanel(opt) {
  var parent = document.getElementById('demo');
  if (!parent)  return;

  var title = document.createElement('div');
  var input = document.createElement('input');
  var dictInput = opt.dictID ? document.createElement('input') : false;
  var output = document.createElement('pre');

  title.innerHTML = '&bull; ' + opt.title + '<br>';
  title.setAttribute('style', 'margin: 18px 0 2px -8px; font-size: 12px;');
  output.setAttribute('style',
    'background-color: #fafafa;  border: 1px solid #ddd; '+
    'color: #333;  font-size: 12px;  font-family: Inconsolata, monospace;' +
    'width: 90%;  min-height: 24px;  margin: 2px 0 0 0;  padding: 0 0 1px 0;' +
    'white-space: pre-wrap;'
  );

  if (dictInput) {  // Only add a dictID-inputfield, if a dictID is given.
    dictInput.setAttribute('style', 'margin: 0 0 0 10px; width: 60px');
    dictInput.setAttribute('placeholder', 'dictID');
    dictInput.value = opt.dictID;
    dictInput.addEventListener('input', function () {
      input.dispatchEvent(new Event('input', {}));  // Make the main input fire.
    });
  }

  parent.appendChild(title);
  parent.appendChild(input);
  if (dictInput)  parent.appendChild(dictInput);
  parent.appendChild(output);

  input.addEventListener('input', function () {
    getNewMatches(
      opt.dictionary, this.value, searchOptionsFunc(), input, dictInput, output
    );
  });

  input.setAttribute('value', opt.initialSearchStr);
  getNewMatches(
    opt.dictionary, input.value, searchOptionsFunc(), input, dictInput, output
  );

  var ans = {input: input};
  if (dictInput)  ans.dictInput = dictInput;
  return ans;

  function searchOptionsFunc() {
    var ans = { perPage: matchesMaxCount };
    if (dictInput) {
      ans.filter = { dictID: [dictInput.value] };  // Always uses latest value.
    }
    return ans;
  }
}



function getNewMatches(dict, str, options, input, dictInput, output) {
  dict.getMatchesForString(str, options, function (err, res) {
    if (err)  { output.innerHTML = 'Error: ' + err;  return }
    for (var i = 0, s = '';  i < res.items.length;  i++) {
      s += matchToString(res.items[i]) + '\n';
    }
    // Place the results, but only if the inputs haven't changed yet.
    if (input.value == str  &&  ( !dictInput || 
        dictInput.value == options.filter.dictID[0] )) {
      output.innerHTML = s;
    }
  });
}



function matchToString(m) {
  var n = '</span>';
  var q = '\'';
  var arr = [
    'type:\''   + m.type + q,
    'dictID:\'' + m.dictID + q,
    'id:\'<span style="font-weight:800; color:#737373">' + m.id  + n + q,
    'str:\'<span style="font-weight:800; color:#a00">'   + m.str + n + q,
  ];
  if (m.style)  arr.push('style:\'<span style="color:#66e">' + m.style + n + q);
  if (m.descr)  arr.push('descr:\'<span style="color:#772">' + m.descr + n + q);
  if (m.z    )  arr.push('z:<span style="color:#db8">' +
    JSON.stringify(m.z) + n);
  if (m.terms)  arr.push('terms:<span style="color:#bbb">' +
    JSON.stringify(m.terms)
      .replace(/"str"/g, 'str')
      .replace(/"style"/g, 'style')
      .replace(/"descr"/g, 'descr') +
    n);

  return '{' + arr.join(', ') + '}';
}
