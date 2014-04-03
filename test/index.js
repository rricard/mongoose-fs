'use strict';
require('should');

var mongoose = require('mongoose');
var mongooseFS = require('../index.js');

var DB_URI = 'mongodb://localhost/test';

describe('For a single record', function () {
  var File = null;
  var id = null;
  var originalFile = null;

  before(function (done) {
    mongoose.connect(DB_URI, function(err) {
      if(err) {
        return done(err);
      }

      var fileSchema = mongoose.Schema({
        name: String
      });

      fileSchema.plugin(mongooseFS, {keys: ['content', 'complement']});
      File = mongoose.model('File', fileSchema);

      var file = new File({
        name: "huge.txt"
      });
      file.content = "anyFetch is cool";
      file.complement = { some: { complicated: { stuff: true } } };

      file.save(function (err, savedFile) {
        if(err) {
          return done(err);
        }
        id = savedFile._id;
        originalFile = savedFile;
        done();
      });
    });
  });

  it('should restore original state after saving', function (done) {
    originalFile.content.should.be.exactly('anyFetch is cool');
    originalFile.complement.some.complicated.stuff.should.be.ok;
    originalFile.get('name').should.be.exactly("huge.txt");
    done();
  });

  it('does store blobs into GridFS', function (done) {
    File.findById(id, function (err, file) {
      if(err) {
        return done(err);
      }
      file.retrieveBlobs(function (err, doc) {
        if(err) {
          return done(err);
        }
        doc.content.should.be.exactly('anyFetch is cool');
        doc.complement.some.complicated.stuff.should.be.ok;
        doc.get('name').should.be.exactly("huge.txt");
        done();
      });
    });
  });

  it('does not alter the document if GridFS is not reloaded', function (done) {
    File.findById(id, function (err, file) {
      if(err) {
        return done(err);
      }
      file.save(function(err, file) {
        if(err) {
          return done(err);
        }
        file.retrieveBlobs(function (err, doc) {
          if(err) {
            return done(err);
          }
          doc.content.should.be.exactly('anyFetch is cool');
          done();
        });
      });
    });
  });

  after(function (done) {
    File.findByIdAndRemove(id, done);
  })

});
