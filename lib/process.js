'use strict';

var esprima  = require('esprima'),
    defaults = require('lodash.defaults'),
    Consumer = require('source-map').SourceMapConsumer;

var esprimaTools     = require('./ast/esprima-tools'),
    findAlterations  = require('./find-alterations'),
    applyAlterations = require('./apply-alterations');

/**
 * Migrate the given content.
 * @param {*} content Javascript content parsable by esprima
 * @param {{filename:string, sourceMap:object, quoteChar:string}} options An options hash
 * @returns {{isChanged:boolean, content:string, sourceMap:object, errors:Array.<string>}} result
 */
function process(content, options) {

  // default options
  options = defaults(options || {}, {
    filename : '-',
    sourceMap: null,
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

        // apply the existing source-map, if present
        if (options.sourceMap && (typeof options.sourceMap === 'object')) {
          altered.generator.applySourceMap(new Consumer(options.sourceMap));
        }

        // complete
        return {
          isChanged: true,
          content  : altered.content,
          sourceMap: altered.generator && JSON.parse(altered.generator.toString()) || null,
          errors   : pending.errors
        };
      }
    }
  }

  // degenerate or unchanged
  return {
    isChanged: false,
    content  : text,
    sourceMap: options.sourceMap,
    errors   : errors
  };
}

module.exports = process;