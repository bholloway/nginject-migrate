# ngInject migration

[![NPM](https://nodei.co/npm/nginject-migration.png)](http://github.com/bholloway/nginject-migration)

Utility to migrate from legacy @ngInject pre-minifier syntax to "ngInject" syntax

## CLI Usage



## API Usage

### `process(content, options):object`

Migrate the given content.

Where output is `{isChanged:boolean, content:string, sourceMap:object, errors:Array.<string>}`.

Where options are `{sourceMap:object, filename:string, quoteChar:string}`.

If the `sourceMap` option is truthy then a source-map is generated. Otherwise it will be `null` in the output. If it is of type `object` then it is expected to be the incoming source-map. Where source-map is used then a `filename` option should indicate the current source.

The optional `quoteChar` option indicates the string literal deliniator.