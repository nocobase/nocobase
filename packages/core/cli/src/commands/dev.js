const chalk = require('chalk');
const { Command } = require('commander');
const { runInstall, run, postCheck, nodeCheck, promptForTs } = require('../util');

/**
 *
 * @param {Command} cli
 */
module.exports = (cli) => {
  cli
    .command('dev')
    .allowUnknownOption()
    .action(async (opts) => {
      promptForTs();
      nodeCheck();
      await postCheck(opts);
      await runInstall();
      run('ts-node-dev', [
        '-P',
        './tsconfig.server.json',
        '-r',
        'tsconfig-paths/register',
        './packages/app/server/src/index.ts',
        'start',
        '-s',
      ]);
      run('umi', ['dev'], {
        env: {
          APP_ROOT: 'packages/app/client',
        },
      });
    });
};
