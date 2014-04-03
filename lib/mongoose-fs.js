'use strict';

/**
 * Transforms keys to GridFS documents
 * Use it as a mongoose plugin
 * @param {Schema} schema The schema
 * @param {object} options The options passed to the plugin
 *   @param {array} keys The keys to take account of
 *   @param {string} bucket The bucket name
 *   @param {Connection} connection An optional MongoDB connection
 *   @param {Mongoose} mongoose An optional Mongoose Instance
 */
var mongooseFSPlugin = function (schema, options) {
  var mongoose = options.mongoose || require('mongoose');
  var Grid = mongoose.mongo.Grid;
  var connection = options.connection || mongoose.connection;
  var bucket = options.bucket || 'fs';

  schema.set("strict", true);

  var schemaAddition = {};
  options.keys.forEach(function (key) {
    schemaAddition[key] = mongoose.Schema.ObjectId;
  });

  schema.add({ _gfsLink: schemaAddition });

  /**
   * Retrieve blobs from GridFS
   * @callback When finished
   *   @param {Error} An error object
   *   @param {bool} The success of the operation
   */
  schema.methods.retrieveBlobs = function (cb) {
    var gfs = Grid(connection.db, bucket);
    var cnt = 0;
    var retrieveBlob = function (key) {
      var loaded = function (err, data) {
        if(err) {
          return cb(err);
        }
        this[key] = JSON.parse(data.toString());
        cnt ++;
        if(cnt === options.keys.length) {
          cb(null, this);
        }
      };
      var gfsId = this.get('_gfsLink.' + key);
      if(gfsId) {
        gfs.get(gfsId, loaded.bind(this));
      } else {
        cnt ++;
        if(cnt === options.keys.length) {
          cb(null, this);
        }
      }

    };
    options.keys.forEach(retrieveBlob.bind(this));
  };

  /**
   * Automatic hook to save blobs to GridFS
   */
  schema.pre('save', function (next) {
    var gfs = Grid(connection.db, bucket);
    var cnt = 0;

    var saveBlob = function (key) {
      var saved = function (err, fileInfo) {
        if(err) {
          return next(err);
        }
        this.set('_gfsLink.' + key, fileInfo._id);
        cnt ++;
        if(cnt === options.keys.length) {
          next();
        }
      };
      if(this[key] !== undefined) {
        var buffer = new Buffer(JSON.stringify(this[key]));
        // [todo] - test the old documents deletion feature
        var oldItem = this.get('_gfsLink.' + key);
        if(oldItem !== undefined) {
          gfs.delete(oldItem, function (err, result) {
            if(err) {
              console.error(err);
            }
          });
        }
        gfs.put(buffer, {
          metadata: {
            _mongooseModel: {
              docId: this._id,
              keyName: key
            }
          },
          content_type: 'application/json'
        }, saved.bind(this));
      } else {
        next();
      }
    };

    options.keys.forEach(saveBlob.bind(this));
  });
};

// Exports
module.exports = exports = mongooseFSPlugin;
