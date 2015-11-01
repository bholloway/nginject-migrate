#!/usr/bin/env node
'use strict';

console.log(require('../index.js').process(require('fs').readFileSync(require('path').resolve('./test/code.js')), {
  sourceMap: true,
  filename : 'blah.js'
}));