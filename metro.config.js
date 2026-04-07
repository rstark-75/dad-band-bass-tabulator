require('dotenv').config({ path: '.env' });

const { getDefaultConfig } = require('expo/metro-config');

module.exports = getDefaultConfig(__dirname);
