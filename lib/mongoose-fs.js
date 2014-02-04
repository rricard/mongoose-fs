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

  // Initialization
  var gfs = Grid(connection.db, bucket);
  if(!schema._gfsLink) {
    schema._gfsLink = {};
  }
  if(!schema._gfsData) {
    schema._gfsData = {};
  }
  
  /**
   * Read/Write ghost attributes for the blobs
   */
  options.keys.forEach(function (key) {
    schema.virtual(key).get(function () {
      return this._gfsData[key];
    });
    schema.virtual(key).set(function (value) {
      this._gfsData[key] = value;
    });
  });

  /**
   * Retrieve blobs from GridFS
   * @callback When finished
   *   @param {Error} An error object
   *   @param {bool} The success of the operation
   */
  schema.methods.retrieveBlobs = function (cb) {
    var cnt = 0;
    for(var key in this._gfsLink) {
      var loaded = function (err, data) {
        if(!err) {
          this._gfsData[key] = JSON.parse(data.toString());
          cnt ++;
          if(cnt == this._gfsLink.length - 1) {
            cb(null, true);
          }
        } else {
          cb(err);
        }
      };
      gfs.get(this._gfsLink[key], {}, loaded.bind(this));
    }
  };

  /**
   * Automatic hook to save blobs to GridFS
   */
  schema.pre('save', function (next) {
    for(var key in this._gfsData) {
      var cnt = 0;
      var buffer = new Buffer(JSON.stringify(this._gfsData[key]));
      var saved = function (err, fileInfo) {
        if(!err) {
          this._gfsLink[key] = fileInfo._id;
          cnt ++;
          if(cnt == this._gfsData.length - 1) {
            next(null, true);
          }
        } else {
          next(err);
        }
      };
      gfs.put(buffer, {}, saved.bind(this));
    }
    this._gfsData = null;
  });
};

// Exports
module.exports = exports = mongooseFSPlugin;