'use strict';

/**
 * Ambil satu item acak dari array
 * @param {Array} arr
 * @returns {*}
 */
function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

module.exports = { pick };