var chai = require('chai')
chai.should()
var ReadStream = require('stream').Readable
var Q = require('q')
chai.use(require('chai-interface'))

describe('charybdis', function () {
  var charybdis = require('../')
  it('smoke test', function (done) {

    // a stream to emit 100 objects
    var rs = new ReadStream({objectMode: true})
    var i = 100
    rs._read = function () {
      this.push(i ? {i: i--} : null)
    }

    var dfds = []
    var allDone = rs.pipe(charybdis(function (obj) {
      if (obj.i % 2) { return false }
      var dfd = Q.defer()
      dfds.push(dfd)
      return dfd.promise
    }))

    allDone.on('tick', function (x) {
      //console.log('f yeah', x)
    })

    allDone.once('inEnd', function () {
      // stream should be ended
      dfds.forEach(function (dfd) {
        dfd.resolve()
      })
    })

    allDone.then(function (stats) {
      stats.should.have.interface({
        objects: Number,
        operations: Number,
        start: Number,
        inEnd: Number,
        end: Number
      })
      stats.objects.should.equal(100)
      stats.operations.should.equal(50)
    }).then(done, done)

  })

  it('works with an empty stream', function (done) {

    var rs = new ReadStream({objectMode: true})
    rs._read = function () {
      this.push(null)
    }
    rs.pipe(charybdis()).then(function (x) { }).then(done, done)

  })
  it('works without an iterator', function (done) {

    var rs = new ReadStream({objectMode: true})
    var i = 10
    rs._read = function () {
      this.push(i ? Q({i: i--}) : null)
    }

    rs.pipe(charybdis()).then(function (stats) {
      stats.operations.should.equal(10)
    })
    .then(done, done)

  })
})