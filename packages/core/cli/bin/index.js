#!/usr/bin/env node

const chalk = require('chalk');
const { initEnv, genTsConfigPaths } = require('../src/util');

initEnv();
genTsConfigPaths();

if (require('semver').satisfies(process.version, '<16')) {
  console.error(chalk.red('[nocobase cli]: Node.js version must be >= 16'));
  process.exit(1);
}

// if (require('semver').satisfies(process.version, '>16') && !process.env.UNSET_NODE_OPTIONS) {
//   if (process.env.NODE_OPTIONS) {
//     let opts = process.env.NODE_OPTIONS;
//     if (!opts.includes('--openssl-legacy-provider')) {
//       opts = opts + ' --openssl-legacy-provider';
//     }
//     if (!opts.includes('--no-experimental-fetch')) {
//       opts = opts + ' --no-experimental-fetch';
//     }
//     process.env.NODE_OPTIONS = opts;
//   } else {
//     process.env.NODE_OPTIONS = '--openssl-legacy-provider --no-experimental-fetch';
//   }
// }

const cli = require('../src/cli');

cli.parse(process.argv);
