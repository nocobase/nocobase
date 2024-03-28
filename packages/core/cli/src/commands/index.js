const { Command } = require('commander');
const { isPackageValid, generateAppDir } = require('../util');

/**
 *
 * @param {Command} cli
 */
module.exports = (cli) => {
  generateAppDir();
  require('./global')(cli);
  require('./create-nginx-conf')(cli);
  require('./build')(cli);
  require('./tar')(cli);
  require('./dev')(cli);
  require('./start')(cli);
  require('./e2e')(cli);
  require('./clean')(cli);
  require('./doc')(cli);
  require('./pm2')(cli);
  require('./test')(cli);
  require('./umi')(cli);
  require('./upgrade')(cli);
  require('./postinstall')(cli);
  if (isPackageValid('@umijs/utils')) {
    require('./create-plugin')(cli);
  }
};
