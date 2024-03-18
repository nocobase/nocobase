const { Command } = require('commander');
const { run } = require('../util');
const path = require('path');

/**
 *
 * @param {String} name
 * @param {Command} cli
 */
function addTestCommand(name, cli) {
  return cli
    .command(name)
    .option('-w, --watch')
    .option('--run')
    .option('--allowOnly')
    .option('--bail')
    .option('-h, --help')
    .option('--single-thread [singleThread]')
    .arguments('[paths...]')
    .allowUnknownOption()
    .action(async (paths, opts) => {
      process.argv.push('--disable-console-intercept');
      if (name === 'test:server') {
        process.env.TEST_ENV = 'server-side';
      } else if (name === 'test:client') {
        process.env.TEST_ENV = 'client-side';
      }
      if (opts.server) {
        process.env.TEST_ENV = 'server-side';
        process.argv.splice(process.argv.indexOf('--server'), 1);
      }
      if (opts.client) {
        process.env.TEST_ENV = 'client-side';
        process.argv.splice(process.argv.indexOf('--client'), 1);
      }
      process.env.NODE_ENV = 'test';
      if (!opts.watch && !opts.run) {
        process.argv.push('--run');
      }
      const first = paths?.[0];
      if (!process.env.TEST_ENV && first) {
        const key = first.split(path.sep).join('/');
        if (key.includes('/client/')) {
          process.env.TEST_ENV = 'client-side';
        } else {
          process.env.TEST_ENV = 'server-side';
        }
      }
      if (process.env.TEST_ENV === 'server-side' && opts.singleThread !== 'false') {
        process.argv.push('--poolOptions.threads.singleThread=true');
      }
      if (opts.singleThread === 'false') {
        process.argv.splice(process.argv.indexOf('--single-thread=false'), 1);
      }
      const cliArgs = ['--max_old_space_size=14096', './node_modules/.bin/vitest', ...process.argv.slice(3)];
      if (process.argv.includes('-h') || process.argv.includes('--help')) {
        await run('node', cliArgs);
        return;
      }
      if (process.env.TEST_ENV) {
        console.log('process.env.TEST_ENV', process.env.TEST_ENV, cliArgs);
        await run('node', cliArgs);
      } else {
        await Promise.all([
          run('node', cliArgs, {
            env: {
              TEST_ENV: 'client-side',
            },
          }),
          run('node', cliArgs, {
            env: {
              TEST_ENV: 'server-side',
            },
          }),
        ]);
      }
    });
}

/**
 *
 * @param {Command} cli
 */
module.exports = (cli) => {
  addTestCommand('test:server', cli);
  addTestCommand('test:client', cli);
  addTestCommand('test', cli).option('--client').option('--server');
};
