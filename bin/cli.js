#!/usr/bin/env node
'use strict';

var startTime = Date.now();

var program = require('commander');

var list    = require('../lib/commands/list'),
    convert = require('../lib/commands/convert');

program
  .command('list')
  .option('-g, --glob [value]', 'A glob to match')
  .action(function (options) {
    list(options)
      .then(getReporter('found'))
      .catch(getReporter('failed for'))
      .finally(complete);
  });

program
  .command('convert')
  .option('-g, --glob [value]', 'A glob to match')
  .option('-l, --list', 'Optionally list of files that will be considered')
  .option('-s, --source-map [value]', 'Generate a source-map file per the given extension')
  .option('-q, --quote-char [value]', 'Optionally specify the quotation character for strings')
  .action(function (options) {
    convert(options)
      .then(options.list && getReporter('processed') || noop)
      .catch(getReporter('failed for'))
      .finally(complete);
  });

program
  .version(require('../package.json').version)
  .parse(process.argv);

function getReporter(message) {
  return function reporter(files) {
    var prefix = [
        message,
        Array.isArray(files) && files.length
      ]
        .filter(Boolean)
        .join(' ') + ':';
    console.log([prefix].concat(files).join('\n\t'));
  }
}

function complete() {
  console.log('completed in', Math.round(Date.now() - startTime) / 1000, 'seconds');
}

function noop() {
}