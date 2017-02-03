//--// Scope levels

/**
 * Authorization scope levels.
 * @readonly
 * @enum {string}
 * @property {string} PUBLIC Read-only access to user's public data.
 * @property {string} PRIVATE Read-only access to user's public and private data.
 * @property {string} WRITE Read/write access to user's public data.
 * @property {string} WRITE_PRIVATE Read/write access to user's public and private data.
 */
module.exports = Object.freeze({
  PUBLIC: 'public',
  PRIVATE: 'private',
  WRITE: 'write',
  WRITE_PRIVATE: 'writePrivate'
});
