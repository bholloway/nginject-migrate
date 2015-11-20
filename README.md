# ngInject migrate

[![NPM](https://nodei.co/npm/nginject-migrate.png)](http://github.com/bholloway/nginject-migrate)

Utility to migrate from legacy @ngInject pre-minifier syntax to "ngInject" syntax

## CLI Usage

There is a simply CLI that can convert your original codebase, to the extent that it is parsable by Esprima 2.x. This
includes some but not all ES6 syntax.

To use the CLI you need to install as a global package.

```
npm i -g nginject-migrate
```

### list

List the files that will be processed per the given glob.

```
nginject-migrate list -g "myDir/**/*.js"
```

Options:

* `-g, --glob [value]` A glob to match, default is `**/*.js`

### convert

Convert files **in place** that match the given glob.

```
nginject-migrate convert -g "myDir/**/*.js"
```

Options:

* `-g, --glob [value]` A glob to match, default is `**/*.js`
* `-l, --list` Optionally list of files that will be considered
* `-s, --source-map [value]` Generate an optional source-map file per the given extension
* `-q, --quote-char [value]` Optionally specify the quotation character for strings

## API Usage

### `processSync(content, options):object`

Migrate the given content.

Where output is `{isChanged:boolean, content:string, sourceMap:object, errors:Array.<string>}`.

Where options are `{sourceMap:object, filename:string, quoteChar:string}`.

If the `sourceMap` option is truthy then a source-map is generated. Otherwise it will be `null` in the output. If it is of type `object` then it is expected to be the incoming source-map. Where source-map is used then a `filename` option should indicate the current source.

The optional `quoteChar` option indicates the string literal delineator to use in the output `content`.