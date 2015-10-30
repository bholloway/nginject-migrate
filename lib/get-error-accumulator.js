'use strict';

/**
 * Create a method that processes errors in order.
 * @param {...Array} lists Any number of arrays to splice at the index in which an error is present
 * @returns {function} A reduce method
 */
module.exports = function getErrorAccumulator() {
  var lists = Array.prototype.slice.call(arguments);

  /**
   * Reduce
   */
  return function reduceErrors(result, candidate, i) {
    if (candidate && (candidate instanceof Error)) {
      if (result.errors.indexOf(candidate.message) < 0) {
        result.errors.push(candidate.message);
      }
      lists.forEach(deleteInList);
    }

    function deleteInList(list) {
      list.slice(i, 1);
    }
  };
};