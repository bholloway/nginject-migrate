'use strict';

var Generator = require('source-map').SourceMapGenerator;

/**
 * Apply changes to the content.
 * @param {string} content The content to process
 * @param {{additions:Array, removals:Array}} pending A hash of additions and removals
 * @returns {{content:string, generator:SourceMapGenerator}} Amended content and source-map generator
 */
function applyAlterations(content, pending) {

  // create a list containing each line and any line terminator relating to it
  //  changes will mutate this list
  var lines = content
    .split(/(\r?\n)/)
    .reduce(mergeByTwos, []);

  // create a source-map generator to track changes in the source
  //  changes will mutate this instance
  var generator = new Generator();

  // if we make later changes first then the remaining locations will not be changed
  pending.additions.map(encode(addition))
    .concat(pending.removals.map(encode(removal)))
    .sort(startLocDescrending)
    .forEach(eachItem);

  return {
    content  : lines.join(''),
    generator: generator
  };

  function eachItem(item) {
    item.operation(lines, item.loc, generator);
  }
}

module.exports = applyAlterations;

/**
 * Merge every pair of elements into the output as a single element.
 */
function mergeByTwos(reduced, unused, i, array) {
  return (i % 2 === 0) ? reduced : reduced.concat(array.slice(i - 1, i + 1));
}

/**
 * Array.sort() compare function that sorts on start location descending
 */
function startLocDescrending(a, b) {
  var dLine   = b.loc.start.line - a.loc.start.line,
      dColumn = b.loc.start.column - a.loc.start.column;
  return dLine || dColumn;
}

/**
 * Create a method that encodes an item with the given operation and converts its current value to a location.
 * @param {function} operation An operation field
 * @returns {function():{operation:function, loc:object}} A method that performs the encoding
 */
function encode(operation) {
  return function eachItem(loc) {
    return {
      operation: operation,
      loc      : loc
    };
  };
}

/**
 * Add "ngInject" directive syntax at the given location.
 * @param {Array.<string>} lines The content to change
 * @param {SourceMapGenerator} generator A generator to mutate
 * @returns {string} Amended content
 */
function addition(lines, loc, generator) {
  var isInline = (loc.start.line === loc.end.line);

}

/**
 * Remove @ngInject comment at the given location.
 * @param {Array.<string>} lines The content to change
 * @param {SourceMapGenerator} generator A generator to mutate
 * @returns {string} Amended content
 */
function removal(lines, loc, generator) {

}