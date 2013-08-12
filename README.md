# charybdis
drain an object stream and wrap it in a promise

## usage

Think of it as a streaming version of Q.all. Pipe a stream of promises
into it and await them all to resolve, or reject on any error.

```js
var charybdis = require('charybdis')

var readStream = // from somewhere

var done = charybdis(readStream, function (obj) {
  // this is called for each object in the readStream
  return Promise(obj)
})

done.then(function (stats) {
  console.log('we just processed ' + stats.operations + ' ops')
})

```

In pseudo code, lets say we want to stream a log file and validate a resource in the db:

```js
read(logfile)
  .pipe(parseLog)
  .pipe(charybdis(validateLogEntry))
  .then(function () { console.log('done')},
    function (err) { console.error(err)})
```

## api

```js
charybdis := (handler?: (Object) => Promise))
              => WriteStream & Promise<Stats>

type Stats : {
  objects: Number,
  operations: Number,
  start: Timestamp,
  streamEnd: Timestamp,
  end: Timestamp
}

emits:
  inEnd: Event<void>  when the ReadStream ends
  tick: Event<Stats>  periodically as processing is happening
resolves:
  when each of the promises is resolved
rejected:
  when any of of the promises is rejected or on stream error
```

The `promiser` is a function called on every item in the read stream.
If it returns a `Promise`, that is considered to be an operation.
Once all input streams have ended and all operations have been resolved,
the aggregate promise will be resolved.


## installation

    $ npm install charybdis


## running the tests

From package root:

    $ npm install
    $ npm test


## contributors

- jden <jason@denizac.org>


## license

MIT. (c) MMXIII AgileMD <hello@agilemd.com>. See LICENSE.md
