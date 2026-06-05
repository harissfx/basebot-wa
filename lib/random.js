'use strict';

/**
 * random.js — Utility random helper
 * Dipakai oleh: src/commands/fun.js
 */

/**
 * Ambil satu item acak dari array
 * @param {Array} arr
 * @returns {*}
 */
function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

module.exports = { pick };