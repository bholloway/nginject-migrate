'use strict';

var q       = require('q'),
    globber = require('glob');

function list(options, isQuiet) {
  var glob     = (typeof options.glob === 'string') && options.glob || '**/*.js',
      deferred = q.defer();

  console.log('using glob:\n\t', glob);
  globber(glob, {}, onGlob);
  return deferred.promise;

  function onGlob(error, files) {
    if (error) {
      console.log('ERROR:', error.message);
      deferred.reject(error);
    }
    else if (!isQuiet) {
      console.log(['file list:'].concat(files).join('\n\t'));
      deferred.resolve(files);
    }
  }
}

module.exports = list;