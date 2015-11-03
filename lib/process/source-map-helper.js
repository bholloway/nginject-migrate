'use strict';

var defaults  = require('lodash.defaults'),
    Generator = require('source-map').SourceMapGenerator,
    Consumer  = require('source-map').SourceMapConsumer;

function sourceMapHelper(filename, sourceMap) {

  var chosenMapping, generator;
  if (!sourceMap) {
    chosenMapping = noMapping;
    generator = null;
  }
  else if (typeof sourceMap === 'object') {
    chosenMapping = offsetMapping;
    generator = Generator.fromSourceMap(new Consumer(sourceMap));
  }
  else {
    chosenMapping = addMapping;
    generator = new Generator();
  }

  return {
    addMapping: chosenMapping,
    toString  : toString
  };

  /**
   * Text representation of the final source-map.
   * @returns {string|null} Source-map text or null where not active
   */
  function toString() {
    return generator && generator.toString() || null;
  }

  /**
   * Add mapping as an offset to an existing source-map.
   * @param {{original:object, generated:object}} mapping A mapping to add
   */
  function offsetMapping(mapping) {
    var dLine   = mapping.generated.line - mapping.original.line,
        dColumn = mapping.generated.column - mapping.original.column;

    generator._mappings
      .unsortedForEach(eachMapping);

    function eachMapping(existing) {

      // line is the same as the original, adjust characters right of the origin of movement
      if ((existing.generatedLine === mapping.original.line) && (existing.generatedColumn >= mapping.original.column)) {
        existing.generatedColumn += dColumn;
      }

      // line movement, adjust lines above the origin of movement
      if ((dLine !== 0) && (existing.generatedLine >= mapping.original.line)) {
        existing.generatedLine += dLine;
      }
    }
  }

  /**
   * Add mapping to a new source-map.
   * @param {{original:object, generated:object}} mapping A mapping to add
   */
  function addMapping(mapping) {
    generator.addMapping(defaults(mapping, {
      source: filename
    }));
  }

  /**
   * Degenerate mapping where we are not doing a source-map.
   */
  function noMapping() {
  }
}

module.exports = sourceMapHelper;
