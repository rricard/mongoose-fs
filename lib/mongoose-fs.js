'use strict';

// Imports
var mongoose = require('mongoose');
var Grid = mongoose.mongo.Grid;

/**
 * Transforms keys to GridFS documents
 * Use it as a mongoose plugin
 * @param {Connection} connection The mongoose connection
 * @param {Schema} schema The schema
 * @param {object} options The options passed to the plugin
 *   @param {array} keys The keys to take account of
 *   @param {string} bucket The bucket name
 *   @param {Connection} connection An optional MongoDB connection
 */
var mongooseFSPlugin = function (schema, options) {
  var connection = options.connection || mongoose.connection;
  var bucket = options.bucket || 'fs';

  var gfs = Grid(connection.db, bucket);

  var schemaAddition = {};
  options.keys.forEach(function (key) {
    schemaAddition[key] = String;
  });

  schema.add({ _gfsLink: schemaAddition });

  /**
   * Retrieve blobs from GridFS
   * @callback When finished
   *   @param {Error} An error object
   *   @param {bool} The success of the operation
   */
  schema.methods.retrieveBlobs = function (cb) {
    var cnt = 0;
    var retrieveBlob = function (key) {
      var loaded = function (err, data) {
        if(err) {
          return cb(err);
        }
        this[key] = JSON.parse(data.toString());
        cnt ++;
        if(cnt === options.keys.length) {
          cb(null, true);
        }
      };
      gfs.get(this._gfsLink[key], {}, loaded.bind(this));
    };
    options.keys.forEach(retrieveBlob.bind(this));
  };

  /**
   * Automatic hook to save blobs to GridFS
   */
  schema.pre('save', function (next) {
    var cnt = 0;

    var saveBlob = function (key) {
      
      var buffer = new Buffer(JSON.stringify(this[key]));
      var saved = function (err, fileInfo) {
        if(err) {
          return cb(err);
        }
        this._gfsLink[key] = fileInfo._id;
        this[key] = null;
        cnt ++;
        if(cnt === options.keys.length) {
          console.log(this);
          next(null, true);
        }
      };
      gfs.put(buffer, {}, saved.bind(this));
    };
    options.keys.forEach(saveBlob.bind(this));
  });
};

// Exports
module.exports = exports = mongooseFSPlugin;