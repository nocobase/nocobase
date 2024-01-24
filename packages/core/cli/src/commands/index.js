const { Command } = require('commander');
const { isPackageValid, generateAppDir } = require('../util');
const treeKill = require('tree-kill');

process.on('SIGINT', async () => {
  treeKill(process.pid, (error) => {
    if (error) {
      console.error(error);
    } else {
      console.log('all subprocesses were killed, exiting main process');
    }
    process.exit();
  });
});

/**
 *
 * @param {Command} cli
 */
module.exports = (cli) => {
  generateAppDir();
  require('./global')(cli);
  require('./build')(cli);
  require('./tar')(cli);
  require('./dev')(cli);
  require('./start')(cli);
  require('./e2e')(cli);
  require('./clean')(cli);
  require('./doc')(cli);
  require('./test')(cli);
  require('./umi')(cli);
  require('./upgrade')(cli);
  require('./postinstall')(cli);
  if (isPackageValid('@umijs/utils')) {
    require('./create-plugin')(cli);
  }
};
