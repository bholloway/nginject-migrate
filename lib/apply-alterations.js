'use strict';

var Generator = require('source-map').SourceMapGenerator;

/**
 * Apply changes to the content.
 * @param {string} content The content to process
 * @param {{additions:Array, removals:Array}} pending A hash of additions and removals
 * @returns {{content:string, generator:SourceMapGenerator}} Amended content and source-map generator
 */
function applyAlterations(content, pending) {
  return {
    content  : content,
    generator: new Generator()
  };
}

module.exports = applyAlterations;