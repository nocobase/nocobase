#!/usr/bin/env node

const dotenv = require('dotenv');
const { resolve } = require('path');

dotenv.config({
  path: resolve(process.cwd(), process.env.NOCOBASE_ENV_PATH || '.env'),
});

const cli = require('../src/cli');

cli.parse(process.argv);
