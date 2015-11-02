'use strict';

var Q = require('q');

var list = require('./list');

function convert(options) {
  return list(options)
    .then(onList)
    .then(onComplete);
}

module.exports = convert;

function onList(list) {
  return Q.allSettled(list.map(processFile));
}

function onComplete(results) {
  var errors = results
    .map(toRejected)
    .filter(Boolean);

  if (errors.length) {
    return Q.reject(errors);
  } else {
    return results.map(toResolved);
  }

  function toRejected(result) {
    return (result.state === 'rejected') && result.reason;
  }

  function toResolved(result) {
    return (result.state === 'fulfilled') && result.value;
  }
}

function processFile(filename) {
  var deferred = Q.defer();

// TODO
if (Math.random() < 0) {
  deferred.reject(filename);
} else {
  deferred.resolve(filename);
}
//
//console.log(require('../index.js').process(require('fs').readFileSync(require('path').resolve('./test/code.js')), {
//  sourceMap: true,
//  filename : 'blah.js'
//}));

  return deferred.promise;
}