#!/usr/bin/env node

const dotenv = require('dotenv');
const { resolve } = require('path');

const env = {
  NOCOBASE_ENV: 'development',
  SERVER_PORT: 13000,
  SERVER_BASE_PATH: '/api/',
  DB_DIALECT: 'sqlite',
  DB_STORAGE: 'storage/db/nocobase.sqlite',
  JWT_SECRET: 'test-jwt-secret',
  DEFAULT_STORAGE_TYPE: 'local',
  LOCAL_STORAGE_DEST: 'storage/uploads',
};

for (const key in env) {
  if (!process.env[key]) {
    process.env[key] = env[key];
  }
}

dotenv.config({
  path: resolve(process.cwd(), process.env.NOCOBASE_ENV_PATH || '.env'),
});

const cli = require('../src/cli');

cli.parse(process.argv);
