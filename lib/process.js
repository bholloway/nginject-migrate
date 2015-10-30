'use strict';

var esprima        = require('esprima'),
    sourcemapToAst = require('sourcemap-to-ast');

var esprimaTools    = require('./esprima-tools'),
    findAlterations = require('./find-alterations');

/**
 * Migrate the given content.
 * @param {string} content Javascript content parsable by esprima
 * @param {string|object} [sourceMapOrFilename] Source-map where available or else the filename of the original content
 * @returns {{isChanged:boolean, content:string, sourceMap:object, errors:Array.<Error>}} result
 */
module.exports = function process(content, sourceMapOrFilename) {

  // inspect arguments
  var filename  = (typeof sourceMapOrFilename === 'string') && sourceMapOrFilename || null,
      sourceMap = (typeof sourceMapOrFilename === 'object') && sourceMapOrFilename || null;

  // default value is unchanged
  var text          = String(content),
      isDengenerate = (text.indexOf('ngInject') < 0),
      result        = {
        isChanged: false,
        content  : text,
        sourceMap: sourceMap,
        errors   : []
      };

  // degenerate case implies no change
  if (isDengenerate) {
    return result;
  }
  // process the content
  else {

    // parse code to AST using esprima
    var ast = esprima.parse(text, {
      loc    : true,
      comment: true,
      source : filename
    });

    // sort nodes before changing the source-map
    var sorted = esprimaTools.orderNodes(ast);

    // associate comments with nodes they annotate
    esprimaTools.associateComments(ast, sorted);

    // locate the character range of the legacy @ngInject annotations to remove and the character range of functions
    //  to add "ngInject" directive annotation to
    var alterations = findAlterations(ast);

    // unrecoverable error
    if (alterations instanceof Error) {
      result.errors.push(alterations.errors);
    }
    // make insertions and deletions
    else {

      // update the AST has the data from the original source map, where present
      //  the source-map locations will then no longer relate to the current code so this must be done after determining
      //  insertion and removal ranges
      if (sourceMap) {
        sourcemapToAst(ast, sourceMap);
      }

      // now make the changes
      //  both result and source-map is mutated in-place
      console.log(alterations);
// TODO
    }

    // complete
    return result;
  }
};