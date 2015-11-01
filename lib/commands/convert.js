'use strict';

var list = require('./list');

function convert(options) {
  list(options, !options.list);

//
//console.log(require('../index.js').process(require('fs').readFileSync(require('path').resolve('./test/code.js')), {
//  sourceMap: true,
//  filename : 'blah.js'
//}));
}

module.exports = convert;