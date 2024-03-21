const chalk = require('chalk');
const crypto = require('crypto');
const { existsSync } = require('fs');
const { join, resolve } = require('path');
const { Generator } = require('@umijs/utils');
const { downloadPackageFromNpm, updateJsonFile } = require('./util');

class AppGenerator extends Generator {
  constructor(options) {
    const { context = {}, ...opts } = options;
    super(opts);
    this.context = context;
    this.env = this.parseEnvs();
  }

  parseEnvs() {
    const envs = this.args.env;
    const items = {};
    for (const env of envs) {
      const keys = env.split('=');
      if (keys.length !== 2) {
        console.log(`${chalk.red(env)} is not a valid environment value`);
        process.exit(1);
      }
      items[keys[0]] = keys[1];
    }
    return items;
  }

  checkDbEnv() {
    const dialect = this.args.dbDialect;
    const env = this.env;
    if (dialect === 'sqlite') {
      return;
    }
    if (!env.DB_DATABASE || !env.DB_USER || !env.DB_PASSWORD) {
      console.log(
        chalk.red(
          `Please set DB_HOST, DB_PORT, DB_DATABASE, DB_USER, DB_PASSWORD in .env file to complete database settings`,
        ),
      );
    }
  }

  checkProjectPath() {
    if (existsSync(this.cwd)) {
      console.log(chalk.red('Project directory already exists'));
      process.exit(1);
    }
  }

  checkDialect() {
    const dialect = this.args.dbDialect;
    const supportDialects = ['mysql', 'mariadb', 'sqlite', 'postgres'];
    if (!supportDialects.includes(dialect)) {
      console.log(
        `dialect ${chalk.red(dialect)} is not supported, currently supported dialects are ${chalk.green(
          supportDialects.join(','),
        )}.`,
      );
      process.exit(1);
    }
  }

  getContext() {
    const env = this.env;
    const envs = [];
    const dependencies = [];
    const { dbDialect, allDbDialect } = this.args;

    if (allDbDialect) {
      dependencies.push(`"mysql2": "^2.3.3"`);
      dependencies.push(`"mariadb": "^2.5.6"`);
      dependencies.push(`"pg": "^8.7.3"`);
      dependencies.push(`"pg-hstore": "^2.3.4"`);
      dependencies.push(`"sqlite3": "^5.0.8"`);
    }

    switch (dbDialect) {
      case 'sqlite':
        if (!allDbDialect) {
          dependencies.push(`"sqlite3": "^5.0.8"`);
        }
        envs.push(`DB_STORAGE=${env.DB_STORAGE || 'storage/db/nocobase.sqlite'}`);
        break;
      case 'mysql':
        if (!allDbDialect) {
          dependencies.push(`"mysql2": "^2.3.3"`);
        }
        envs.push(`DB_HOST=${env.DB_HOST || 'localhost'}`);
        envs.push(`DB_PORT=${env.DB_PORT || 3306}`);
        envs.push(`DB_DATABASE=${env.DB_DATABASE || ''}`);
        envs.push(`DB_USER=${env.DB_USER || ''}`);
        envs.push(`DB_PASSWORD=${env.DB_PASSWORD || ''}`);
        break;
      case 'mariadb':
        if (!allDbDialect) {
          dependencies.push(`"mariadb": "^2.5.6"`);
        }
        envs.push(`DB_HOST=${env.DB_HOST || 'localhost'}`);
        envs.push(`DB_PORT=${env.DB_PORT || 3306}`);
        envs.push(`DB_DATABASE=${env.DB_DATABASE || ''}`);
        envs.push(`DB_USER=${env.DB_USER || ''}`);
        envs.push(`DB_PASSWORD=${env.DB_PASSWORD || ''}`);
        break;
      case 'postgres':
        if (!allDbDialect) {
          dependencies.push(`"pg": "^8.7.3"`);
          dependencies.push(`"pg-hstore": "^2.3.4"`);
        }
        envs.push(`DB_HOST=${env.DB_HOST || 'localhost'}`);
        envs.push(`DB_PORT=${env.DB_PORT || 5432}`);
        envs.push(`DB_DATABASE=${env.DB_DATABASE || ''}`);
        envs.push(`DB_USER=${env.DB_USER || ''}`);
        envs.push(`DB_PASSWORD=${env.DB_PASSWORD || ''}`);
        break;
    }

    const keys = ['PLUGIN_PACKAGE_PREFIX', 'DB_HOST', 'DB_PORT', 'DB_DATABASE', 'DB_USER', 'DB_PASSWORD', 'DB_STORAGE'];

    for (const key in env) {
      if (keys.includes(key)) {
        continue;
      }
      envs.push(`${key}=${env[key]}`);
    }

    return {
      ...this.context,
      dependencies: dependencies.join(`,\n    `),
      envs: envs.join(`\n`),
      env: {
        APP_PORT: 13000,
        APP_ENV: 'development',
        DB_DIALECT: dbDialect,
        APP_KEY: crypto.randomBytes(256).toString('base64'),
        // PLUGIN_PACKAGE_PREFIX: `@nocobase/plugin-,@nocobase/preset-,@${this.context.name}/plugin-`,
        ...env,
      },
    };
  }

  async downloadServerPackage() {
    const { name } = this.context;
    console.log('Download: @nocobase/app-server');
    const serverPackageDir = resolve(this.cwd, 'packages/app/server');
    await downloadPackageFromNpm('@nocobase/app-server', serverPackageDir);
    await updateJsonFile(resolve(serverPackageDir, 'package.json'), (data) => {
      data['name'] = `@${name}/app-server`;
      data['version'] = '0.1.0';
      return data;
    });
  }

  async downloadClientPackage() {
    const { name } = this.context;
    console.log('Download: @nocobase/app-client');
    const clientPackageDir = resolve(this.cwd, 'packages/app/client');
    await downloadPackageFromNpm('@nocobase/app-client', clientPackageDir);
    await updateJsonFile(resolve(clientPackageDir, 'package.json'), (data) => {
      data['name'] = `@${name}/app-client`;
      data['version'] = '0.1.0';
      return data;
    });
  }

  async writing() {
    this.checkProjectPath();
    this.checkDialect();

    const { name } = this.context;

    console.log(`Creating a new NocoBase application at ${chalk.green(name)}`);
    console.log('Creating files');

    this.copyDirectory({
      context: this.getContext(),
      path: join(__dirname, '../templates/app'),
      target: this.cwd,
    });

    this.checkDbEnv();

    console.log('');
    console.log(chalk.green(`$ cd ${name}`));
    console.log(chalk.green(`$ yarn install`));
    console.log(chalk.green(`$ yarn nocobase install`));
    console.log(chalk.green(`$ yarn dev`));
    console.log('');
  }
}

exports.AppGenerator = AppGenerator;
