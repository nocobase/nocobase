const { Command } = require('commander');
const { run, postCheck, nodeCheck } = require('../util');

/**
 *
 * @param {Command} cli
 */
module.exports = (cli) => {
  cli
    .command('dev')
    .allowUnknownOption()
    .action(async (opts) => {
      nodeCheck();
      await postCheck(opts);
      run('ts-node-dev', [
        '-P',
        './tsconfig.server.json',
        '-r',
        'tsconfig-paths/register',
        './packages/app/server/src/index.ts',
        'start',
      ]);
      run('umi', ['dev'], {
        env: {
          APP_ROOT: 'packages/app/client',
        },
      });
    });
};
