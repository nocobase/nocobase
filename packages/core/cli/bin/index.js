#!/usr/bin/env node

const dotenv = require('dotenv');
const { resolve } = require('path');

const env = {
  APP_PACKAGE_ROOT: 'app',
  APP_ENV: 'development',
  APP_KEY: 'test-jwt-secret',
  APP_PORT: 13000,
  API_BASE_PATH: '/api/',
  DB_DIALECT: 'sqlite',
  DB_STORAGE: 'storage/db/nocobase.sqlite',
  DEFAULT_STORAGE_TYPE: 'local',
  LOCAL_STORAGE_DEST: 'storage/uploads',
};

if ('v18' === process.version.split('.').shift()) {
  process.env.NODE_OPTIONS = '--openssl-legacy-provider';
}

dotenv.config({
  path: resolve(process.cwd(), process.env.APP_ENV_PATH || '.env'),
});

for (const key in env) {
  if (!process.env[key]) {
    process.env[key] = env[key];
  }
}

const cli = require('../src/cli');

cli.parse(process.argv);
