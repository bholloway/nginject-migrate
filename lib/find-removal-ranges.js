'use strict';

var testDocTag = require('./test-doc-tag');

var PURE_COMMENT = /^[\W\\n]*@ngInject[\W\\n]*$/;

/**
 * Find the character ranges of @ngInject doctags within the given ast.
 * @param {object} ast An esprima AST with comments
 * @returns {Error|Array.<Error|Object>} Error on failure else a character range for each valid comment
 */
module.exports = function findRemovalRanges(ast) {
  if (ast.comments) {
    return ast.comments
      .filter(testDocTag)
      .reduce(reduceNodeToRanges, []);
  } else {
    return new Error('Esprima AST is required to have top-level comments array');
  }
};

/**
 * Get the location of the comment(s) that we might remove.
 * @returns {Array} A list of ranges that may be removed
 */
function reduceNodeToRanges(list, node) {

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