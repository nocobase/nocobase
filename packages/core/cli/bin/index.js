#!/usr/bin/env node

const dotenv = require('dotenv');
const { resolve } = require('path');
const fs = require('fs');
const chalk = require('chalk');
const { genTsConfigPaths } = require('../src/util');

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
  PLUGIN_STORAGE_PATH: resolve(process.cwd(), 'storage/plugins'),
  MFSU_AD: 'none',
  NODE_MODULES_PATH: resolve(process.cwd(), 'node_modules'),
  PM2_HOME: resolve(process.cwd(), './storage/.pm2'),
  PLUGIN_PACKAGE_PREFIX: '@nocobase/plugin-,@nocobase/plugin-sample-,@nocobase/preset-',
  SERVER_TSCONFIG_PATH: './tsconfig.server.json',
};

if (!process.env.APP_ENV_PATH && process.argv[2] && process.argv[2] === 'test') {
  if (fs.existsSync(resolve(process.cwd(), '.env.test'))) {
    process.env.APP_ENV_PATH = '.env.test';
  }
}

if (process.argv[2] === 'e2e') {
  // 用于存放 playwright 自动生成的相关的文件
  if (!fs.existsSync('playwright')) {
    fs.mkdirSync('playwright');
  }
  if (!fs.existsSync('.env.e2e') && fs.existsSync('.env.e2e.example')) {
    const env = fs.readFileSync('.env.e2e.example');
    fs.writeFileSync('.env.e2e', env);
  }
  if (!fs.existsSync('.env.e2e')) {
    throw new Error('Please create .env.e2e file first!');
  }
  process.env.APP_ENV_PATH = '.env.e2e';
}

genTsConfigPaths();

dotenv.config({
  path: resolve(process.cwd(), process.env.APP_ENV_PATH || '.env'),
});

for (const key in env) {
  if (!process.env[key]) {
    process.env[key] = env[key];
  }
}

if (process.argv[2] === 'e2e' && !process.env.APP_BASE_URL) {
  process.env.APP_BASE_URL = `http://127.0.0.1:${process.env.APP_PORT}`;
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
