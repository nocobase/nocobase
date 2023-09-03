#!/usr/bin/env node

const dotenv = require('dotenv');
const { resolve } = require('path');
const { existsSync } = require('fs');
const chalk = require('chalk');

const env = {
  APP_ENV: 'development',
  APP_KEY: 'test-jwt-secret',
  APP_PORT: 13000,
  API_BASE_PATH: '/api/',
  DB_DIALECT: 'sqlite',
  DB_STORAGE: 'storage/db/nocobase.sqlite',
  DB_TIMEZONE: '+00:00',
  DEFAULT_STORAGE_TYPE: 'local',
  LOCAL_STORAGE_DEST: 'storage/uploads',
  MFSU_AD: 'none',
  PM2_HOME: resolve(process.cwd(), './storage/.pm2'),
  PLUGIN_PACKAGE_PREFIX: '@nocobase/plugin-,@nocobase/plugin-sample-,@nocobase/preset-',
};

if (!process.env.APP_ENV_PATH && process.argv[2] && process.argv[2] === 'test') {
  if (existsSync(resolve(process.cwd(), '.env.test'))) {
    process.env.APP_ENV_PATH = '.env.test';
  }
}

dotenv.config({
  path: resolve(process.cwd(), process.env.APP_ENV_PATH || '.env'),
});

for (const key in env) {
  if (!process.env[key]) {
    process.env[key] = env[key];
  }
}

if (require('semver').satisfies(process.version, '<16')) {
  console.error(chalk.red('[nocobase cli]: Node.js version must be >= 16'));
  process.exit(1);
}

if (require('semver').satisfies(process.version, '>16') && !process.env.UNSET_NODE_OPTIONS) {
  if (process.env.NODE_OPTIONS) {
    let opts = process.env.NODE_OPTIONS;
    if (!opts.includes('--openssl-legacy-provider')) {
      opts = opts + ' --openssl-legacy-provider';
    }
    if (!opts.includes('--no-experimental-fetch')) {
      opts = opts + ' --no-experimental-fetch';
    }
    process.env.NODE_OPTIONS = opts;
  } else {
    process.env.NODE_OPTIONS = '--openssl-legacy-provider --no-experimental-fetch';
  }
}

const cli = require('../src/cli');

cli.parse(process.argv);
