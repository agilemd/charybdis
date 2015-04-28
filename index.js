var Promise = require('polyfill-promise')
const EventEmitter = require('events').EventEmitter
const util = require('util')
const Writable = require('stream').Writable
const refcount = require('refcount')

// users
//   .pipe(update)
//   .pipe(charybdis())
//   .then

function K(x) { return x }

// ((Object) => Promise) => WriteStream & Promise
// emits: 'inEnd' when the ReadStream ends
// resolves: when each of the promises is resolved
// rejected: when any of of the promises is rejected or on stream error
function charybdis (iterator) {
  iterator = iterator || K
  const stream = new Writable({objectMode: true})
  const deferred = Promise.defer()

  const stats = stream.stats = {
    objects: 0,
    operations: 0,
    pending: 0,
    start: Date.now(),
    inEnd: 0,
    end: 0,
  }

  var sources = refcount()
  stream.on('pipe', onPipe)
  function onPipe (src) {
    sources.push()
    src.on('end', function () {
      sources.pop()
    })
    src.once('error', cleanup)
  }
  sources.on('clear', function () {
    stats.inEnd = Date.now()
    stream.emit('inEnd')
    tryResolve()
  })

  stream._write = function(obj, encoding, cb) {
    stats.objects++
    var op = iterator(obj)
    if (!op || !op.then) {
      tick()
      return cb()
    }

    stats.pending++
    stats.operations++

    tick()

    op.then(function () {
      stats.pending--
      tryResolve()
    },
    cleanup)

    cb()
  }

  function tryResolve() {
    // in streams ended and no operations pending?
    if (stats.inEnd && !stats.pending) { cleanup() }
    else tick()
  }

  function tick() {
    stream.emit('tick', stats)
  }

  function cleanup(err) {
    stream.removeListener('pipe', onPipe)
    sources.removeAllListeners()

    if (err) {
      deferred.reject(err)
    }
    stats.end = Date.now()

    deferred.resolve(stats)
  }

  stream.then = deferred.promise.then.bind(deferred.promise)

  return stream
}

module.exports = charybdis