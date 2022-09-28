const chalk = require('chalk');
const { resolve } = require('path');
const { Command,Option } = require('commander');
const { AppGenerator } = require('./generator');
const { concat } = require('./util');
const packageJson = require('../package.json');

const cli = new Command('create-nocobase');

cli
  .arguments('<name>', 'directory of new NocoBase app')
  .option('--quickstart', 'quickstart app creation')
  .option('-a, --all-db-dialect', 'install all database dialect dependencies')
  .option('-d, --db-dialect <dbDialect>', 'database dialect, current support sqlite/mysql/postgres', 'sqlite')
  .addOption(
    new Option('-c, --cache-store-package <cacheStorePackage>', 'cache store package').choices([
      'all',
      'cache-manager-redis',
      'cache-manager-redis-store ',
      'cache-manager-ioredis',
      'cache-manager-mongodb',
      'cache-manager-mongoose',
      'cache-manager-fs-binary',
      'cache-manager-fs-hash',
      'cache-manager-hazelcast',
      'cache-manager-memcached-store',
      'cache-manager-couchbase',
    ]),
  )
  // -d, --drink <size>     drink cup size (choices: "small", "medium", "large")
  .option('-e, --env <env>', 'environment variables write into .env file', concat, [])
  .description('create a new application')
  .action(async (name, options) => {
    if (options.quickstart) {
      console.log(`⚠️  ${chalk.yellow('quickstart option is deprecated')}`);
    }

    const generator = new AppGenerator({
      cwd: resolve(process.cwd(), name),
      args: options,
      context: {
        name,
        version: packageJson.version,
      },
    });

    await generator.run();
  });

module.exports = cli;
