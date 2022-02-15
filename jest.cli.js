const yargs = require('yargs');

if (yargs.argv.dbDialect) {
  process.env.DB_DIALECT = yargs.argv.dbDialect;
}

console.log('DB_DIALECT: ', process.env.DB_DIALECT);

require('jest-cli/bin/jest');
