//--// Utilities

const _ = require('lodash');
const mongoose = require('mongoose');

/**
 * Converts a model to JSON and sanitizes its instance so it can be safely returned
 *  to a client.
 * @param {Mongoose.Model} model Model to convert to JSON and sanitize.
 * @returns {Object} Sanitized model JSON. This is a new object that references the
 *  specified `model`'s JSON representation but excludes properties and values that
 *  should not be exposed to a client.
 * @throws {Error} if `model` is not a Mongoose Model.
 */
const sanitizeModel = function(model) {
  if (!model || !(model instanceof mongoose.Model)) {
    throw new Error('invalid model');
  }

  const json = model.toJSON();
  const sanJson = {};

  _.forOwn(json, (value, key) => {
    // for now, filter-out mongodb model '__v' and '_id' properties
    // TODO: may need to sanitize other properties?
    if (key.indexOf('_') !== 0) {
      sanJson[key] = value;
    }
  });

  return sanJson;
};

module.exports = {
  sanitizeModel
};
