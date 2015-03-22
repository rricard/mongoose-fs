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

    var retrieveBlob = function (key, gfs, context) {
      return new Promise(function (resolve, reject) {
        var loaded = function (err, data) {
          if (err) reject(err);
            context[key] = JSON.parse(data.toString());
            resolve();
          };

        var gfsId = context.get('_gfsLink.' + key);
        if (gfsId) {
          gfs.get(gfsId, loaded.bind(context));
        } else {
          resolve();
        }
      });
    };

    var promises = [];

    var gfs = Grid(connection.db, bucket);
    var context = this;
    options.keys.forEach(function (key) { promises.push(retrieveBlob(key, gfs, context)); });

    Promise.all(promises)
      .then(function () { cb(null, context); })
      .catch(function(error) { cb(error, context);})
  };

  /**
   * Automatic hook to save blobs to GridFS
   */
  schema.pre('save', function (next) {
    var saveBlob = function (key, gfs, context) {

    return new Promise(function (resolve, reject) {

      var saved = function (err, fileInfo) {
        if (err) reject(err);                                        
        context.set('_gfsLink.' + key, fileInfo._id);                    
        resolve();
      };

      if (context[key] !== undefined) {
        var buffer = new Buffer(JSON.stringify(context[key]));
        // [todo] - test the old documents deletion feature
        var oldItem = context.get('_gfsLink.' + key);
        if (oldItem !== undefined) {
          gfs.delete(oldItem, function (err, result) {
            if (err) reject(err);
          });
        }
                    
        gfs.put(buffer, {
          metadata: {
            _mongooseModel: {
              docId: context._id,
              keyName: key
            }
          },
          content_type: 'application/json'
        }, saved.bind(context));
      } else {
        resolve();
      }
    });
  };
        
  var promises = [];
  var gfs = Grid(connection.db, bucket);
  var context = this;
  options.keys.forEach(function (key) { promises.push(saveBlob(key,gfs, context)); });

  Promise.all(promises)
    .then(function () {next();})
    .catch(function (err) {
      next(err);
    });
  });
};

// Exports
module.exports = exports = mongooseFSPlugin;
