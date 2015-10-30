'use strict';

var esprimaTools = require('./esprima-tools'),
    testNode     = require('./ast-tests'),
    testDocTag   = require('./test-doc-tag');

/**
 * Find the character range of an annotated function within the given ast.
 * @param {object} ast An esprima AST with comments
 * @returns {Error|Array.<Error|Object>} Error on failure else a character range or Error for each annotation
 */
module.exports = function findAnnotatedRanges(ast) {
  if (ast.comments) {
    return ast.comments
      .filter(testDocTag)
      .map(getAnnotatedNode)
      .filter(truthyFirstOccurance) // ensure unique values
      .map(getRange);
  } else {
    return new Error('Esprima AST is required to have top-level comments array');
  }
};

/**
 * Get the node that is annotated by the comment or Error if not present.
 * @param {object} comment The comment node
 * @returns {object|Error} The annotated node or Error on failure
 */
function getAnnotatedNode(comment) {

  // find the first function declaration or expression following the annotation
  var result;
  if (comment.annotates) {
    var candidateTrees;

    // consider the context the block is in (i.e. what is its parent)
    var parent = comment.annotates.parent;

    // consider nodes from the annotated node forward
    //  include the first non-generated node and all generated nodes preceding it
    if (testNode.isBlockOrProgram(parent)) {
      var body = parent.body;
      var index = body.indexOf(comment.annotates);
      var candidates = body.slice(index);
      var length = candidates.map(testNode.isGeneratedCode).indexOf(false) + 1;
      candidateTrees = candidates.slice(0, length || candidates.length);
    }
    // otherwise we can only consider the given node
    else {
      candidateTrees = [comment.annotates];
    }

    // try the nodes
    while (!result && candidateTrees.length) {
      result = esprimaTools
        .orderNodes(candidateTrees.shift())
        .filter(testNode.isFunctionNotIFFE)
        .shift();
    }
  }

  // return result or error
  return result || new Error('Doc-tag @ngInject does not annotate anything');
}


/**
 * Test whether the given value is the first occurance in the array.
 * @param {*} value The value to test
 * @param {number} i The index of the value in the array
 * @param {Array} array The array the value is within at the given index
 */
function truthyFirstOccurance(value, i, array) {
  return !!value && (array.indexOf(value) === i);
}

/**
 * Get the location of the function body where we might do the insertion.
 * @param {Error|object} nodeOrError An error or an esprima node
 * @returns {{start:{line:number,column:number},end:{line:number,column:number}} The location of the insertion
 */
function getRange(nodeOrError) {
  return ('body' in nodeOrError) ? nodeOrError.body.loc : nodeOrError;
}