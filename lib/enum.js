//--// Enumeration

const _ = require('lodash');

// TODO: test this and use it in scopeType.js and grantType.js, as well as authorize.js and token.js...

/**
 * Makes an enumeration type which provides convenience methods for treating an
 *  object as an enumeration.
 * @param {Object} pairs Key/value pairs for the enumeration. These will be
 *  assigned to the new object's own-properties by reference.
 * @returns {Object} A new object with key/value pairs specified.
 * @throws {Error} If `pairs` is not valid.
 * @throws {Error} If any pair has `undefined` as its value.
 */
const makeEnum = function(pairs) {
  if (!_.isObject(pairs) || _.isArray(pairs)) {
    throw new Error('invalid pairs: must be an actual object');
  }

  if (_.values(pairs).includes(undefined)) {
    throw new Error('undefined cannot be a value');
  }

  const proto = {
    /** @returns {Array.<*>} List of enum keys. */
    keys() {
      return _.keys(this);
    },

    /** @returns {Array.<*>} List of enum values. */
    values() {
      return _.values(this);
    },

    /**
     * Verifies a value is part of this enumeration.
     * @param {*} value Value to check.
     * @returns {*} The value specified if found in this enumeration; `undefined`
     *  otherwise or if `value` was `undefined`.
     */
    verify(value) {
      if (value !== undefined && this.values().includes(value)) {
        return value;
      }

      return undefined; // not found (or `value` was `undefined`)
    }
  };

  const enumObj = Object.create(proto); // put methods in proto to keep own-props clean
  Object.assign(enumObj, pairs); // put members as own-props
  Object.freeze(enumObj); // freeze own-props

  return enumObj;
};

module.exports = {
  makeEnum
};
