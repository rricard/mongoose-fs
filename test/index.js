'use strict';
require('should');

var mongoose = require('mongoose');
var mongooseFS = require('../index.js');

describe('On a connected database', function () {
  before(function (done) {
    mongoose.connect('mongodb://localhost/test');
    var db = mongoose.connection;
    db.on('error', console.error.bind(console, 'connection error:'));
    db.once('open', done);
  });

  describe('with a simple File model', function() {
    var File = null;

    before(function (done) {
      var fileSchema = mongoose.Schema({
        name: String,
        content: String,
        complement: {}
      });
      fileSchema.plugin(mongooseFS, {keys: ['content', 'complement']});
      File = mongoose.model('File', fileSchema);
      done();
    });

    describe('for one file', function () {
      before(function (done) {
        var hugeFile = new File({
          name: "huge.txt",
          content: "anyFetch is cool",
          complement: { some: { complicated: { stuff: true } } }
        });
        hugeFile.save(done);
      });

      it('does not store blobs into the mongo document', function (done) {
        File.find({name: "huge"}, function (err, file) {
          if(err) {
            return done(err);
          }
          file.should.not.have.property('content');
          file.should.not.have.property('complement');
          done(err);
        });
      });

      it('does store blobs into GridFS', function (done) {
        File.find({name: "huge"}, function (err, file) {
          if(err) {
            return done(err);
          }
          file.retrieveBlobs(function (err) {
            if(err) {
              return done(err);
            }
            file.should.have.property('content', 'anyFetch is cool');
            file.some.complicated.should.have.property('stuff', true);
            done();
          });
          
        });
      });
    });
    
  });
});