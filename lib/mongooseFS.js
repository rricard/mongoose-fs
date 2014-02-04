'use strict';

// Imports
var mongoose = require('mongoose');
var Grid = require('gridfs-stream');
Grid.mongo = mongoose.mongo;

/**
 * Transforms a key stored in a document into a GridFS document
 * @param {Grid} gfs The GridFS object
 * @param {Schema} schema The model's schema
 * @param {string} path The path of the attribute
 */
var processGFSKey = function (gfs, schema, key) {
  var filename = "_mfs_" + schema.path('_id').toString() + "_" + key;

  schema.pre('save', function (next) {
    
  });
};

/**
 * Transforms keys to GridFS documents
 * Use it as a mongoose plugin
 * @param {Connection} connection The mongoose connection
 * @param {Schema} schema The schema
 * @param {object} options The options passed to the plugin
 *   @param {array} keys The keys to take account of
 *   @param {Connection} connection An optional MongoDB connection
 */
var mongooseFSPlugin = function (schema, options) {
  var connection = options.connection || mongoose.connection;
  connection.once('open', function () {
    var gfs = Grid(connection.db);

    if(!schema._gfsProxy) {
      schema._gfsProxy = {};
    }

    options.keys.forEach(function (key) {
      processGFSKey(gfs, schema, key);
    });
  });
};

// Exports
module.exports = exports = mongooseFSPlugin;