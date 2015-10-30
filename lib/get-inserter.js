/**
 * Get a method that will reduce insertion ranges into the content.
 * @param {object} sourceMap A source-map to update
 * @param {Array} dependents A list of ranges that will need to be updated
 */
module.exports = function getInserter(sourceMap, dependents) {
  /**
   * Reduce method.
   */
  return function inserter(result, range) {
    return result;
  };
}