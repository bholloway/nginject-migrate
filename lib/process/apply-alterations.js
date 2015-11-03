'use strict';

var sourceMapHelper = require('./source-map-helper');

/**
 * Apply changes to the content.
 * @param {string} content The content to process
 * @param {{additions:Array, removals:Array}} pending A hash of additions and removals
 * @param {{filename:string, sourceMap:object, quoteChar:string}} options An options hash
 * @returns {{content:string, sourceMap:string}} Amended content and source-map strings
 */
function applyAlterations(content, pending, options) {

  // additions will be the '"ngInject";' directive
  var directive = options.quoteChar + 'ngInject' + options.quoteChar + ';';

  // create a list containing each line and any line terminator relating to it
  //  changes will mutate this list
  var offsetLines = content
    .split(/(\r?\n)/)
    .reduce(mergeByTwos, []);

  // prepend additional element so that each source mapping.line gives the correct element index
  var lines = [''].concat(offsetLines);

  // create a source-map generator to track changes in the source
  var mapper = sourceMapHelper(options.filename, options.sourceMap);

  // if we make later changes first then the remaining locations will not be changed
  pending.additions.map(encode(addition))
    .concat(pending.removals.map(encode(removal)))
    .sort(startLocDescending)
    .forEach(executeItem);

  return {
    content  : lines.join(''),
    sourceMap: JSON.parse(mapper.toString())
  };

  /**
   * Add "ngInject" directive syntax at the given location.
   * @param {{line:number, column:number}} start A start location from where we might insert
   * @param {{line:number, column:number}} end An end location to where we might insert
   */
  function addition(start, end) {

    // look at the first line and determine whether we should annotate in the first line
    var fnDeclaration       = lines[start.line].slice(0, start.column),
        blockOuterFirstLine = lines[start.line].slice(start.column),
        blockOuterPrefix    = blockOuterFirstLine.match(/^\s*\{/)[0],
        blockInnerFirstLine = blockOuterFirstLine.slice(blockOuterPrefix.length),
        isInline            = !(/^\s*$/.test(blockInnerFirstLine));

    // comment in the same line
    if (isInline) {

      // text change
      lines[start.line] = fnDeclaration + blockOuterPrefix + directive + blockInnerFirstLine;

      // source-map change
      mapper.addMapping({
        original : start,
        generated: {
          line  : start.line,
          column: start.column + directive.length
        }
      });
    }
    // comment on a new line
    else {
      var firstLine  = start.line + 1,
          lastLine   = end.line - 1,
          text       = lines[firstLine],
          indent     = lines.slice(firstLine, lastLine + 1).reduce(reduceIndent, null),
          eol        = text.match(/\r?\n$/)[0],
          additional = indent + directive + eol;

      // text change
      lines.splice(firstLine, 0, additional);

      // source-map change
      mapper.addMapping({
        original : {
          line  : firstLine,
          column: 0
        },
        generated: {
          line  : firstLine + 1,
          column: 0
        }
      });
    }
  }

  /**
   * Remove @ngInject comment at the given location.
   * @param {{line:number, column:number}} start A start location from where we might remove
   * @param {{line:number, column:number}} end An end location to where we might remove
   */
  function removal(start, end) {
    var BLANK = /^\s+$/;

    // text change
    for (var index = start.line; index <= end.line; index++) {
      var text    = lines[index],
          isFirst = (index === start.line),
          isLast  = (index === end.line),
          pending;

      // first and last line in one
      if (isFirst && isLast) {
        pending = text.slice(0, start.column) + text.slice(end.column);
      }
      // multiple lines
      else {
        pending = isFirst ? text.slice(0, start.column) : isLast ? text.slice(end.column) : '';
      }

      // remove blank lines
      lines[index] = /*BLANK.test(pending) ? '' :*/ pending; // TODO out of memory
    }

    // tick over to the next line if we have removed all the content from this one
    var isWholeLineStart = (lines[start.line] === ''),
        isWholeLineEnd   = (lines[end.line] === ''),
        column           = isWholeLineStart ? 0 : start.column;

    // source-map change
    mapper.addMapping({
      original : isWholeLineEnd ? {line: end.line + 1, column: column} : end,
      generated: isWholeLineStart ? {line: start.line, column: column} : start
    });
  }
}

module.exports = applyAlterations;

/**
 * Merge every pair of elements into the output as a single element.
 * Make sure we cater for final unpaired element.
 */
function mergeByTwos(reduced, value, i, array) {
  var isFinal   = (i === array.length - 1),
      lastValue = array[i - 1];
  return (i % 2 === 1) ? reduced.concat(lastValue + value) : isFinal ? reduced.concat(value) : reduced;
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
function reduceIndent(reduced, line, i) {
  var analysis = /[^\s\r\n]/.test(line) && /^\s*/.exec(line), // has some text then get whitespace prefix
      indent   = !!analysis && analysis[0],
      isBetter = (typeof indent === 'string') && (!reduced || (indent.length < reduced.length));
  return isBetter ? indent : reduced;
}