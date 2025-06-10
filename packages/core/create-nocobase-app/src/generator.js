/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

const chalk = require('chalk');
const crypto = require('crypto');
const { existsSync, promises } = require('fs');
const fs = require('fs-extra');
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

  checkProjectPath() {
    if (existsSync(this.cwd)) {
      console.log(chalk.red('Project directory already exists'));
      process.exit(1);
    }
  }

  getContext() {
    const env = this.env;
    const envs = [];
    const dependencies = [];
    const { dbDialect } = this.args;

    switch (dbDialect) {
      case 'mysql':
        envs.push(`DB_HOST=${env.DB_HOST || 'localhost'}`);
        envs.push(`DB_PORT=${env.DB_PORT || 3306}`);
        envs.push(`DB_DATABASE=${env.DB_DATABASE || ''}`);
        envs.push(`DB_USER=${env.DB_USER || ''}`);
        envs.push(`DB_PASSWORD=${env.DB_PASSWORD || ''}`);
        break;
      case 'mariadb':
        envs.push(`DB_HOST=${env.DB_HOST || 'localhost'}`);
        envs.push(`DB_PORT=${env.DB_PORT || 3306}`);
        envs.push(`DB_DATABASE=${env.DB_DATABASE || ''}`);
        envs.push(`DB_USER=${env.DB_USER || ''}`);
        envs.push(`DB_PASSWORD=${env.DB_PASSWORD || ''}`);
        break;
      case 'kingbase':
      case 'postgres':
        envs.push(`DB_HOST=${env.DB_HOST || 'localhost'}`);
        envs.push(`DB_PORT=${env.DB_PORT || 5432}`);
        envs.push(`DB_DATABASE=${env.DB_DATABASE || ''}`);
        envs.push(`DB_USER=${env.DB_USER || ''}`);
        envs.push(`DB_PASSWORD=${env.DB_PASSWORD || ''}`);
        break;
    }

    const keys = ['DB_HOST', 'DB_PORT', 'DB_DATABASE', 'DB_USER', 'DB_PASSWORD', 'DB_STORAGE'];

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

    const { name } = this.context;

    console.log(`Creating a new NocoBase application at ${chalk.green(name)}`);
    console.log('Creating files');

    const context = this.getContext();

    this.copyDirectory({
      context,
      path: join(__dirname, '../templates/app'),
      target: this.cwd,
    });

    const json = {
      name: context.name,
      ...(await fs.readJSON(join(this.cwd, 'package.json'), 'utf8')),
    };

    json['dependencies']['@nocobase/cli'] = context.version;

    if (!this.args.skipDevDependencies) {
      json['devDependencies'] = json['devDependencies'] || {};
      json['devDependencies']['@nocobase/devtools'] = context.version;
    }

    await fs.writeJSON(join(this.cwd, 'package.json'), json, { encoding: 'utf8', spaces: 2 });
    console.log('');
    console.log(chalk.green(`$ cd ${name}`));
    console.log(chalk.green(`$ yarn install`));
    console.log(chalk.green(`$ yarn nocobase install`));
    console.log(chalk.green(`$ yarn dev`));
    console.log('');
  }
}

exports.AppGenerator = AppGenerator;
