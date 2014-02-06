'use strict';
require('should');

var mongoose = require('mongoose');
var mongooseFS = require('../index.js');

var DB_URI = 'mongodb://localhost/test';

describe('On a connected database', function () {
  before(function (done) {
    mongoose.connect(DB_URI, done);
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
      var id; 

      before(function (done) {
        var hugeFile = new File({
          name: "huge.txt",
          content: "anyFetch is cool",
          complement: { some: { complicated: { stuff: true } } }
        });
        hugeFile.save(function (err, file) {
          if(err) {
            return done(err);
          }
          id = file._id;
          done();
        });
      });

      it('does not store blobs into the mongo document', function (done) {
        File.findById(id, function (err, file) {
          if(err) {
            return done(err);
          }
          (file.get('content') === undefined).should.be.ok;
          (file.get('complement') === undefined).should.be.ok;
          file.get('name').should.be.exactly("huge.txt");
          done(err);
        });
      });

      it('does store blobs into GridFS', function (done) {
        File.findOne({name: "huge.txt"}, function (err, file) {
          if(err) {
            return done(err);
          }
          file.retrieveBlobs(function (err) {
            if(err) {
              return done(err);
            }
            file.get('content').should.be.exactly('anyFetch is cool');
            file.get('complement.some.complicated.stuff').should.be.ok;
            file.get('name').should.be.exactly("huge.txt");
            done();
          });
          
        });
      });
    });
    
  });
});