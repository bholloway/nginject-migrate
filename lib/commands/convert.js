'use strict';

var path = require('path');

var Q   = require('q'),
    fsp = require('fs-promise');

var list        = require('./list'),
    processSync = require('../process/process-sync');

/**
 * Convert files matching the given glob.
 * @params {{glob:string|undefined, sourceMap:boolean|string}} Hash of options
 */
function convert(options) {
  return list(options)
    .then(onList)
    .then(onComplete);

  function onList(list) {
    return Q.allSettled(list.map(processFile));

    function processFile(contentFilename) {
      var sourceMapExt        = options.sourceMap && ((typeof options.sourceMap === 'string') || 'map'),
          sourceMapFilename   = sourceMapExt && (contentFilename + '.' + sourceMapExt),
          resolvedContentFile = path.resolve(contentFilename),
          resolvedMapFile     = sourceMapFilename && path.resolve(sourceMapFilename);

      return Q.all([
          fsp.exists(resolvedContentFile),
          resolvedMapFile && fsp.exists(resolvedMapFile)
        ])
        .then(onExists)
        .then(onData);

      function onExists(exists) {
        var hasContentFile   = exists[0],
            hasSourceMapFile = exists[1];
        if (!hasContentFile) {
          return Q.reject(contentFilename + ' (missing)');
        }
        else {
          return Q.all([
            fsp.readFile(resolvedContentFile),
            hasSourceMapFile && fsp.readFile(resolvedMapFile)
          ]);
        }
      }

      function onData(data) {
        var content   = String(data[0]),
            sourceMap = !!data[1] && JSON.parse(String(data[1])) || options.sourceMap,
            pending   = processSync(content, {
              filename : resolvedContentFile,
              sourceMap: sourceMap,
              quoteChar: options.quoteChar
            }),
            promises  = pending.isChanged && [
                fsp.writeFile(resolvedContentFile, pending.content),
                pending.sourceMap && fsp.writeFile(resolvedMapFile, JSON.stringify(pending.sourceMap, null, 2))
              ].filter(Boolean);

        return Q.all(promises)
          .then(getLabel);

        function getLabel() {
          return (pending.errors.length ? '\u2716' : '\u2713') + ' ' + contentFilename;
        }
      }
    }
  }
}

module.exports = convert;

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
