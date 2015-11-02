'use strict';

var Q       = require('q'),
    globber = require('glob');

function list(options, isQuiet) {
  var glob     = (typeof options.glob === 'string') && options.glob || '**/*.js',
      deferred = Q.defer();

  console.log('using glob:\n\t', glob);
  globber(glob, {}, onGlob);
  return deferred.promise;

  function onGlob(error, files) {
    if (error) {
      deferred.reject(error.message);
    }
    else if (!isQuiet) {
      deferred.resolve(files);
    }
  }
}

module.exports = list;