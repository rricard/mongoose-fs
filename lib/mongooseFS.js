
/**
 * Transforms a key stored in a document into a GridFS document
 * @param {Schema} schema The model's schema
 * @param {string} path The path of the attribute
 */
var processGFSPath = function (schema, path) {

};

/**
 * Transforms keys to GridFS documents
 * Use it as a mongoose plugin
 * @param {Schema} schema The schema
 * @param {object} options The options passed to the plugin
 *   @param {array} keys The keys to take account of
 */
var mongooseFSPlugin = function (schema, options) {
  options.keys.forEach(function() {
    processGFSPath(schema, path);
  });
};

// Exports
module.exports = exports = mongooseFSPlugin;