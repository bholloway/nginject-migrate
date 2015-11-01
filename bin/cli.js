#!/usr/bin/env node
'use strict';

var program = require('commander');

var list    = require('../lib/commands/list'),
    convert = require('../lib/commands/convert');

program
  .command('list')
  .option('-g, --glob [value]', 'A glob to match')
  .action(list);

program
  .command('convert')
  .option('-g, --glob [value]', 'A glob to match')
  .option('-l, --list', 'Optionally list of files that will be considered')
  .option('-o, --output [value]', 'An optional output directory')
  .option('-s, --source-map', 'Generate a source-map file per the given extension')
  .action(convert);

program
  .version(require('../package.json').version)
  .parse(process.argv);