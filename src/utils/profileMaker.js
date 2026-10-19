'use strict';

const sharp = require('sharp');
const { getAssetBuffer } = require('./remoteAsset');

const CONFIG = {
    box: {
        x: 0,
        y: 562,
        width: 470,
        height: 478,
    },

    jpegQuality: 92,
};

async function generateProfilePic(photoBuffer) {
    const frameBuffer = await getAssetBuffer('bahanProfile');

    const { x, y, width, height } = CONFIG.box;
    const cropped = await sharp(photoBuffer)
        .rotate()
        .resize(width, height, { fit: 'cover', position: 'centre' })
        .toBuffer();

    const result = await sharp(frameBuffer)
        .composite([{ input: cropped, left: x, top: y }])
        .jpeg({ quality: CONFIG.jpegQuality })
        .toBuffer();

    return result;
}

module.exports = { generateProfilePic, CONFIG };