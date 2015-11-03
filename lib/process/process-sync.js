'use strict';

var esprima  = require('esprima'),
    defaults = require('lodash.defaults');

var esprimaTools     = require('../ast/esprima-tools'),
    findAlterations  = require('./find-alterations'),
    applyAlterations = require('./apply-alterations');

/**
 * Migrate the given content.
 *
 * If the `sourceMap` option is truthy then a source-map is generated. Otherwise it will be `null` in the output. If it
 * is of type `object` then it is expected to be the incoming source-map. Where source-map is used then a `filename`
 * option should indicate the current source.
 *
 * The optional `quoteChar` option indicates the string literal deliniator.
 *
 * @param {*} content Javascript content parsable by esprima
 * @param {{sourceMap:object, filename:string, quoteChar:string}} options An options hash
 * @returns {{isChanged:boolean, content:string, sourceMap:object, errors:Array.<string>}} result
 */
function processSync(content, options) {

  // default options
  options = defaults(options || {}, {
    sourceMap: null,
    filename : '-',
    quoteChar: '"'
  });

  // process any content that contains @ngInject
  var text    = String(content),
      isFound = (text.indexOf('@ngInject') >= 0),
      errors  = [];
  if (isFound) {
    var ast;

    // parse code to AST using esprima
    try {
      ast = esprima.parse(text, {
        loc    : true,
        comment: true
      });
    }
    catch (error) {
      errors.push(error.message);
    }

    // where parsing completed
    if (ast) {

      // associate comments with nodes they annotate
      var sorted = esprimaTools.orderNodes(ast);
      esprimaTools.associateComments(ast, sorted);

      // locate the character range of the legacy @ngInject annotations to remove and the character range of functions
      //  to add "ngInject" directive annotation to functions
      var pending = findAlterations(ast);

      // changes will occur
      if (pending.hasChange) {

        // now make the changes
        var altered = applyAlterations(text, pending, options);

        // complete
        return {
          isChanged: true,
          content  : altered.content,
          sourceMap: altered.sourceMap,
          errors   : pending.errors
        };
      }
    }
  }

  // degenerate or unchanged
  //  make sure we don't echo back a boolean source-map option
  return {
    isChanged: false,
    content  : text,
    sourceMap: !!options.sourceMap && (typeof options.sourceMap === 'object') && options.sourceMap || null,
    errors   : errors
  };
}

module.exports = processSync;
