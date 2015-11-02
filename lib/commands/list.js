'use strict';

var Q       = require('q'),
    globber = require('glob');

/**
 * List files matching the given glob.
 * @params {{glob:string|undefined}} Hash of options
 */
function list(options) {
  var glob     = (typeof options.glob === 'string') && options.glob || '**/*.js',
      deferred = Q.defer();

  console.log('using glob:\n\t' + glob);
  globber(glob, {}, onGlob);
  return deferred.promise;

  function onGlob(error, files) {
    if (error) {
      deferred.reject(error.message);
    }
    else {
      deferred.resolve(files);
    }
  }
}

module.exports = list;