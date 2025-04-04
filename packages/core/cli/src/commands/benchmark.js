/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

const path = require('path');
const { glob } = require('fs/promises');
const { Command } = require('commander');
const { run } = require('../util');

/**
 *
 * @param {Command} cli
 */
module.exports = (cli) => {
  return (
    cli
      .command('benchmark')
      // .option('--single-thread [singleThread]')
      .option('--all -a [all]')
      .arguments('[paths...]')
      .allowUnknownOption()
      .action(async (paths, opts) => {
        process.env.NODE_ENV = 'test';
        process.env.LOGGER_LEVEL = 'error';

        const cliArgs = ['--max_old_space_size=14096'];

        if (process.argv.includes('-h') || process.argv.includes('--help')) {
          await run('node', cliArgs);
          return;
        }

        if (!opts.singleThread) {
          process.argv.splice(process.argv.indexOf('--single-thread=false'), 1);
        } else {
          process.argv.push('--poolOptions.threads.singleThread=true');
        }

        if (!paths.length) {
          if (opts.all) {
            paths.push('**/*.benchmark.{js,ts}');
          } else {
            console.log(
              'No benchmark files specified. Please provide at least 1 benchmark file or path to run. Or use --all to run all "*.benchmark.{js,ts}".',
            );
            return;
          }
        }

        const files = [];

        for (const pattern of paths) {
          for await (const file of glob(pattern)) {
            files.push(file);
          }
        }

        if (!files.length) {
          console.log('No benchmark files found');
          return;
        }

        for (const file of files) {
          await run('tsx', [...cliArgs, file]);
        }
      })
  );
};
