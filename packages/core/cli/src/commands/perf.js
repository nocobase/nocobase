/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

const path = require('path');
const fs = require('fs');
// const init = require('@nocobase/server/__perf__/init');
const { Command } = require('commander');
const dotenv = require('dotenv');
const { run } = require('../util');

/**
 * Performance testing command
 * @param {Command} cli
 */
module.exports = (cli) => {
  const perf = cli.command('perf');
  perf
    .command('init')
    .arguments('<file>')
    .description('Initialize performance testing app')
    .action(async (file, options) => {
      if (!file) {
        throw new Error('Please provide the path to the init script');
      }
      const f = path.isAbsolute(file) ? file : path.join(process.cwd(), file);
      if (!fs.statSync(file).isFile()) {
        throw new Error(`Init script file not found: ${file}`);
      }
      // const envFile = fs.existsSync(path.resolve(process.cwd(), '.env.test')) ? '.env.test' : '.env';
      // const cliArgs = ['--max_old_space_size=4096'];
      await run(`tsx`, [f]);
    });
  perf
    .command('run')
    .arguments('<file>')
    .description('Run performance testing script')
    .option('-e, --env-file <env>', 'Environment file to load', '.env.perf')
    .allowUnknownOption(true)
    .action(async (file, options, command) => {
      const f = path.isAbsolute(file) ? file : path.join(process.cwd(), file);
      if (!fs.statSync(f).isFile()) {
        throw new Error(`Performance testing script file not found: ${f}`);
      }
      if (options.envFile) {
        const envFilePath = path.resolve(process.cwd(), options.envFile);
        if (fs.statSync(envFilePath).isFile()) {
          dotenv.config({ path: envFilePath, override: true });
        }
      }
      if (!process.env.API_BASE_URL) {
        throw new Error('Please set API_BASE_URL in environment variables or in .env.perf file');
      }
      const args = command.args.filter((arg) => arg !== file);
      await run(`k6`, ['run', f, ...(args.length ? ['--', ...args] : [])]);
    });
  return perf;
};
