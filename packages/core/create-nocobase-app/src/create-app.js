const chalk = require('chalk');
const fse = require('fs-extra');
const path = require('path');
const { hasYarn, runInit, runInstall } = require('./utils');
const ora = require('ora');
const execa = require('execa');
const { join, resolve } = require('path');

const createEnvFile = require('./resources/templates/env');
const createPackageJson = require('./resources/templates/package.json.js');
const createServerPackageJson = require('./resources/templates/server.package.json.js');
const createClientPackageJson = require('./resources/templates/client.package.json.js');
const loadSrcFromNpm = require('./resources/templates/load-src-from-npm');

let envs = undefined;

const parseEnvs = (options) => {
  if (envs) {
    return envs;
  }

  for (const env of options.env) {
    if (!env.match(/\w+=\w+/)) {
      console.log(`${chalk.red(env)} is not a valid environment value`);
      process.exit(1);
    }
  }

  envs = options.env
    .map((env) => env.split('='))
    .reduce((carry, item) => {
      carry[item[0]] = item[1];
      return carry;
    }, {});

  return envs;
};

function checkDialect(dialect) {
  const supportDialects = ['mysql', 'sqlite', 'postgres'];
  if (!supportDialects.includes(dialect)) {
    console.log(
      `dialect ${chalk.red(dialect)} is not supported, currently supported dialects are ${chalk.green(
        supportDialects.join(','),
      )}.`,
    );
    process.exit(1);
  }
}

const getDatabaseOptionsFromCommandOptions = (commandOptions) => {
  const envs = parseEnvs(commandOptions);

  if (!commandOptions.dbDialect || commandOptions.dbDialect === 'sqlite' || envs['DB_STORAGE']) {
    return {
      dialect: 'sqlite',
      storage: envs['DB_STORAGE'] || 'storage/db/nocobase.sqlite',
    };
  }

  const databaseOptions = {
    dialect: commandOptions.dbDialect,
    host: envs['DB_HOST'],
    port: envs['DB_PORT'],
    database: envs['DB_DATABASE'],
    user: envs['DB_USER'],
    password: envs['DB_PASSWORD'],
  };

  const emptyValues = Object.entries(databaseOptions).filter((items) => !items[1]);

  if (emptyValues.length > 0) {
    console.log(
      chalk.red(
        `Please set ${emptyValues
          .map((i) => i[0])
          .map((i) => `DB_${i.toUpperCase()}`)
          .join(' ')} in .env file to complete database settings`,
      ),
    );
  }

  return databaseOptions;
};

async function createApp(directory, options) {
  const dbDialect = options.dbDialect || 'sqlite';
  checkDialect(dbDialect);

  if (options.quickstart) {
    console.log(`⚠️  ${chalk.yellow('quickstart option is deprecated')}`);
  }

  parseEnvs(options);

  console.log(`Creating a new NocoBase application at ${chalk.green(directory)}.`);
  console.log('Creating files.');

  const projectPath = path.join(process.cwd(), directory);
  const resourcePath = path.join(__dirname, 'resources');

  const dbOptions = getDatabaseOptionsFromCommandOptions(options);

  // copy files
  await fse.copy(path.join(resourcePath, 'files'), projectPath);

  console.log('download @nocobase/app-server');
  await loadSrcFromNpm('@nocobase/app-server', path.join(projectPath, 'packages/app/server'));

  console.log('download @nocobase/app-client');
  await loadSrcFromNpm('@nocobase/app-client', path.join(projectPath, 'packages/app/client'));

  // write .env file
  await fse.writeFile(join(projectPath, '.env'), createEnvFile({ dbOptions, envs: parseEnvs(options) }));

  // write root packages.json
  await fse.writeJson(
    join(projectPath, 'package.json'),
    createPackageJson({
      projectName: 'nocobase-app',
    }),
    {
      spaces: 2,
    },
  );

  // write server package.json
  await fse.writeJson(
    join(projectPath, 'packages/app/server/package.json'),
    createServerPackageJson({
      projectPath,
      dbOptions,
    }),
    {
      spaces: 2,
    },
  );

  // write client package.json
  await fse.writeJson(
    join(projectPath, 'packages/app/client/package.json'),
    createClientPackageJson({
      projectPath,
    }),
    {
      spaces: 2,
    },
  );

  // run install command
  console.log('finished');
}

function collect(value, previous) {
  return previous.concat([value]);
}

function setCommandOptions(command) {
  return command
    .arguments('<directory>', 'directory of new NocoBase app')
    .option('--quickstart', 'Quickstart app creation')
    .option('-d, --db-dialect <dbdialect>', 'Database dialect, current support sqlite/mysql/postgres')
    .option('-e, --env <envvalue>', 'environment variables write into .env file', collect, [])
    .description('create a new application');
}

module.exports = {
  setCommandOptions,
  createApp,
};
