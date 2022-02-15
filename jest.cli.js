const dotenv = require('dotenv');
const { existsSync } = require('fs');
const { resolve } = require('path')
const yargs = require('yargs');

const envFile = existsSync(resolve(__dirname, '.env.test')) ? '.env.test' : '.env';

dotenv.config({
  path: resolve(__dirname, envFile),
});

if (yargs.argv.dbDialect) {
  process.env.DB_DIALECT = yargs.argv.dbDialect;
}

console.log('DB_DIALECT: ', process.env.DB_DIALECT);

require('jest-cli/bin/jest');
