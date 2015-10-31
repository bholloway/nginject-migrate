'use strict';

var esprima  = require('esprima'),
    Consumer = require('source-map').SourceMapConsumer;

var esprimaTools     = require('./ast/esprima-tools'),
    findAlterations  = require('./find-alterations'),
    applyAlterations = require('./apply-alterations');

/**
 * Migrate the given content.
 * @param {string} content Javascript content parsable by esprima
 * @param {string|object} [sourceMapOrFilename] Source-map where available or else the filename of the original content
 * @returns {{isChanged:boolean, content:string, sourceMap:object, errors:Array.<string>}} result
 */
function process(content, sourceMapOrFilename) {

  // inspect arguments
  var filename     = (typeof sourceMapOrFilename === 'string') && sourceMapOrFilename || null,
      sourceMapObj = (typeof sourceMapOrFilename === 'object') && sourceMapOrFilename || null;

  // process any content that contains @ngInject
  var text    = String(content),
      isFound = (text.indexOf('@ngInject') >= 0);
  if (isFound) {

    // parse code to AST using esprima
    //  we need block comments to be parsed too
    var ast = esprima.parse(text, {
      loc    : true,
      comment: true,
      source : filename
    });

    // associate comments with nodes they annotate
    var sorted = esprimaTools.orderNodes(ast);
    esprimaTools.associateComments(ast, sorted);

    // locate the character range of the legacy @ngInject annotations to remove and the character range of functions
    //  to add "ngInject" directive annotation to functions
    var alterations = findAlterations(ast);

    // changes will occur
    if ((alterations.removals.length > 0) || (alterations.additions.length > 0)) {

      // now make the changes
      var altered = applyAlterations(text);

      // apply the existing source-map, if present
      if (sourceMapObj) {
        altered.generator.applySourceMap(new Consumer(sourceMapObj));
      }

      // complete
      return {
        isChanged: true,
        content  : altered.content,
        sourceMap: JSON.parse(altered.generator.toString()),
        errors   : alterations.errors
      };
    }
  }

  // degenerate or unchanged
  return {
    isChanged: false,
    content  : text,
    sourceMap: sourceMapObj,
    errors   : []
  };
}

module.exports = process;