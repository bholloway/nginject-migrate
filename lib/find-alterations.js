'use strict';

var esprimaTools = require('./ast/esprima-tools'),
    testNode     = require('./ast/ast-tests');

/**
 * Find the character range of an annotated function within the given AST.
 * @param {object} ast An esprima AST with comments
 * @returns {Error|Array.<Error|Object>} Error on failure else a character range or Error for each annotation
 */
function findAlterations(ast) {
  var annotatedFnNodes = ast.comments
    .filter(testDocTag)
    .map(getAnnotatedNode);

  var errors = annotatedFnNodes
    .filter(isError);

  var additions = annotatedFnNodes
    .filter(noCorrespondingError(annotatedFnNodes))
    .filter(truthyFirstOccurance) // ensure unique values
    .reduce(itemToAddRange, []);

  var removals = ast.comments
    .filter(noCorrespondingError(annotatedFnNodes))
    .reduce(itemToRemoveRange, []);

  return {
    errors   : errors,
    additions: additions,
    removals : removals,
    hasChange: (removals.length > 0) || (additions.length > 0)
  };
}

module.exports = findAlterations;

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
  return result || 'Doc-tag @ngInject does not annotate anything';
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
 * Test if the given value is an Error, meaning a string.
 */
function isError(value) {
  return (typeof value === 'string');
}

/**
 * Create a method that tests there is no corresponding error in the reference Array at the given location.
 * @param {Array} reference An array of values, where Errors are represented as strings
 * @returns {function} An Array.filter() method
 */
function noCorrespondingError(reference) {
  return function test(unused, i) {
    return !isError(reference[i]);
  };
}

/**
 * Reduce each item to a list of add operations.
 * @param {object} node An esprima node
 * @returns {{start:{line:number,column:number},end:{line:number,column:number}} The location of the insertion
 */
function itemToAddRange(list, node) {
  return list.concat(node.body.loc);
}

/**
 * Reduce each item to a list of remove operations.
 * @param {Error|object} nodeOrError An error or an esprima node
 * @returns {{start:{line:number,column:number},end:{line:number,column:number}} The location of the insertion
 */
function itemToRemoveRange(list, node) {
  var PURE_COMMENT = /^[\W\\n]*@ngInject[\W\\n]*$/;

  // if the comment is pure it may be removed entirely
  if (PURE_COMMENT.test(node.value)) {
    return list.concat(node.loc);
  }
  // otherwise we just remove the lines that are pure
  else {
    return node.value.split(/(\r?\n)/)
      .reduce(eachLine, list);
  }

  /**
   * Reduce each line of the comment, every other value is the new line characters.
   * @returns {object|undefined} A range that may be removed
   */
  function eachLine(list, text, i, array) {
    if ((i % 2 === 0) && PURE_COMMENT.test(text)) {
      var line = node.loc.start.line + i / 2;
      return list.concat({
        start: {
          line  : line,
          column: (i === 0) ? node.loc.start.column : 0
        },
        end  : {
          line  : line,
          column: (i === array.length - 1) ? node.loc.end.column : (text.length + array[i + 1].length)
        }
      });
    } else {
      return list;
    }
  }
}

/**
 * Test the comment content for the <code>@ngInject</code> doctag.
 * @param {object} comment The comment node
 */
function testDocTag(comment) {
  return /@ngInject/i.test(comment.value);
}