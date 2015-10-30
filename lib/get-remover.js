/**
 * Get a method that will reduce removal ranges into the content.
 * @param {object} sourceMap A source-map to update
 * @param {Array} dependents A list of ranges that will need to be updated
 */
module.exports = function getRemover(sourceMap, dependents) {
  /**
   * Reduce method.
   */
  return function remover(result, range) {
    return result;
  };
}