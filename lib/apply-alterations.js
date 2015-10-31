'use strict';

var Generator = require('source-map').SourceMapGenerator;

/**
 * Apply changes to the content.
 * @param {string} content The content to process
 * @param {{additions:Array, removals:Array}} pending A hash of additions and removals
 * @param {string} quoteChar String literal character to use
 * @returns {{content:string, generator:SourceMapGenerator}} Amended content and source-map generator
 */
function applyAlterations(sourcePath, content, pending, quoteChar) {

  // additions will be the '"ngInject";' directive
  var directive = quoteChar + 'ngInject' + quoteChar + ';';

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
    .sort(startLocDescending)
    .forEach(executeItem);

  return {
    content  : lines.join(''),
    generator: generator
  };

  /**
   * Add "ngInject" directive syntax at the given location.
   * @param {{line:number, column:number}} start A start location from where we might insert
   * @param {{line:number, column:number}} end An end location to where we might insert
   */
  function addition(start, end) {

    // zero-based start and end indices
    var startZero = zeroBased(start),
        endZero   = zeroBased(end);

    // look at the first line and determine whether we should annotate in the first line
    var fnDeclaration       = lines[startZero.line].slice(0, startZero.column),
        blockOuterFirstLine = lines[startZero.line].slice(startZero.column),
        blockOuterPrefix    = blockOuterFirstLine.match(/^\s*\{/)[0],
        blockInnerFirstLine = blockOuterFirstLine.slice(blockOuterPrefix.length),
        isInline            = !(/^\s*$/.test(blockInnerFirstLine));

    // comment in the same line
    if (isInline) {
      lines[startZero.line] = fnDeclaration + blockOuterPrefix + directive + blockInnerFirstLine;
      generator.addMapping({
        source   : sourcePath,
        original : start,
        generated: {
          line  : start.line,
          column: start.column + directive.length
        }
      });
    }
    // comment on a new line
    else {
      var indexFirst = startZero.line + 1,
          indexLast  = endZero.line - 1,
          text       = lines[indexFirst],
          indent     = lines.slice(indexFirst, indexLast + 1).reduce(reduceIndent, text),
          eol        = text.match(/\r?\n$/)[0],
          additional = indent + directive + eol;

      // text change
      lines.splice(indexFirst, 0, additional);

      // source-map change
      generator.addMapping({
        source   : sourcePath,
        original : oneBased({
          line  : indexFirst,
          column: 0
        }),
        generated: oneBased({
          line  : indexFirst + 1,
          column: 0
        })
      });
    }
  }

  /**
   * Remove @ngInject comment at the given location.
   * @param {{line:number, column:number}} start A start location from where we might remove
   * @param {{line:number, column:number}} end An end location to where we might remove
   */
  function removal(start, end) {

    // zero-based start and end indices
    var startZero = zeroBased(start),
        endZero   = zeroBased(end);

    // text change
    lines.slice(endZero.line, endZero.line + 1)
      .forEach(eachLine);

    // source-map change
    generator.addMapping({
      source   : sourcePath,
      original : end,
      generated: start
    });

    function eachLine(text, i, array) {
      var index = endZero.line + i;

      // first and last line in one
      if (array.length === 1) {
        lines[index] = text.slice(0, startZero.column) + text.slice(endZero.column + 1);
      }
      // first line
      else if (i === 0) {
        lines[index] = text.slice(0, startZero.column);
      }
      // last line
      else if (i === array.length - 1) {
        lines[index] = text.slice(endZero.column + 1);
      }
    }
  }
}

module.exports = applyAlterations;

/**
 * Merge every pair of elements into the output as a single element.
 */
function mergeByTwos(reduced, value, i, array) {
  return (i % 2 === 0) ? reduced : reduced.concat(array[i - 1] + value);
}

/**
 * Execute the item operation.
 * @param {{operation:function, loc:object}} item The item to execute
 */
function executeItem(item) {
  item.operation(item.loc.start, item.loc.end);
}

/**
 * Array.sort() compare function that sorts on start location descending
 */
function startLocDescending(a, b) {
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
 * Determine leading whitespace over by reducing a number of lines.
 */
function reduceIndent(reduced, line) {
  var analysis = /^\s*/.exec(line),
      indent   = analysis && analysis[0];
  return indent && (indent.length < reduced.length) && indent || reduced;
}

/**
 * Convert all values in the location from 1-based to 0-based.
 * @param {{line:number, column:number}} loc A location with 1-based numeric fields
 * @returns {{line:number, column:number}} A location with 0-based numeric fields
 */
function zeroBased(loc) {
  return {
    line  : loc.line - 1,
    column: loc.column - 1
  };
}

/**
 * Convert all values in the location from 0-based to 1-based.
 * @param {{line:number, column:number}} A location with 0-based numeric fields
 * @returns {{line:number, column:number}} loc A location with 1-based numeric fields
 */
function oneBased(loc) {
  return {
    line  : loc.line + 1,
    column: loc.column + 1
  };
}