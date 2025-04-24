/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

const { Command } = require('commander');
const { run, isPortReachable, checkDBDialect } = require('../util');
const { execSync } = require('node:child_process');
const axios = require('axios');
const { pTest } = require('./p-test');
const os = require('os');
const treeKill = require('tree-kill');
const chalk = require('chalk');

/**
 * 检查服务是否启动成功
 */
const checkServer = async (duration = 1000, max = 60 * 10) => {
  return new Promise((resolve, reject) => {
    let count = 0;
    const timer = setInterval(async () => {
      if (count++ > max) {
        clearInterval(timer);
        return reject(new Error('Server start timeout.'));
      }

      // if (!(await checkPort(PORT))) {
      //   return;
      // }

      const url = `${process.env.APP_BASE_URL}/api/__health_check`;
      // console.log('url', url);

      axios
        .get(url)
        .then((response) => {
          if (response.status === 200) {
            clearInterval(timer);
            resolve(true);
          }
        })
        .catch((error) => {
          console.error('Request error:', error?.response?.data?.error);
        });
    }, duration);
  });
};

/**
 * 检查 UI 是否启动成功
 * @param duration
 */
const checkUI = async (duration = 1000, max = 60 * 10) => {
  return new Promise((resolve, reject) => {
    let count = 0;
    const timer = setInterval(async () => {
      if (count++ > max) {
        clearInterval(timer);
        return reject(new Error('UI start timeout.'));
      }

      axios
        .get(`${process.env.APP_BASE_URL}/__umi/api/bundle-status`)
        .then((response) => {
          if (response.data === 'ok') {
            clearInterval(timer);
            resolve(true);
            return;
          }
          if (response.data.bundleStatus.done) {
            clearInterval(timer);
            resolve(true);
          }
        })
        .catch((error) => {
          console.error('Request error:', error.message);
        });
    }, duration);
  });
};

async function appReady() {
  console.log('check server...');
  await checkServer();
  console.log('server is ready, check UI...');
  await checkUI();
  console.log('UI is ready.');
}

async function runApp(options = {}) {
  console.log('installing...');
  await run('nocobase', ['install', '-f']);
  await run('nocobase', ['pm', 'enable-all']);
  if (await isPortReachable(process.env.APP_PORT)) {
    console.log('app started');
    return;
  }
  console.log('starting...');
  run('nocobase', [process.env.APP_ENV === 'production' ? 'start' : 'dev'], options);
}

process.on('SIGINT', async () => {
  treeKill(process.pid, (error) => {
    if (error) {
      console.error(error);
    } else {
      console.log(chalk.yellow('Force killing...'));
    }
    process.exit();
  });
});

const commonConfig = {
  stdio: 'inherit',
};

const runCodegenSync = () => {
  try {
    execSync(
      `npx playwright codegen --load-storage=storage/playwright/.auth/codegen.auth.json ${process.env.APP_BASE_URL} --save-storage=storage/playwright/.auth/codegen.auth.json`,
      commonConfig,
    );
  } catch (err) {
    if (err.message.includes('auth.json')) {
      execSync(
        `npx playwright codegen ${process.env.APP_BASE_URL} --save-storage=storage/playwright/.auth/codegen.auth.json`,
        commonConfig,
      );
    } else {
      console.error(err);
    }
  }
};

const filterArgv = () => {
  const arr = process.argv.slice(4);
  const argv = [];
  for (let index = 0; index < arr.length; index++) {
    const element = arr[index];
    if (element === '--url') {
      index++;
      continue;
    }
    if (element.startsWith('--url=')) {
      continue;
    }
    if (element === '--build') {
      continue;
    }
    if (element === '--production') {
      continue;
    }
    argv.push(element);
  }
  return argv;
};

/**
 *
 * @param {Command} cli
 */
module.exports = (cli) => {
  const e2e = cli.command('e2e').hook('preAction', () => {
    checkDBDialect();
    if (process.env.APP_BASE_URL) {
      process.env.APP_BASE_URL = process.env.APP_BASE_URL.replace('localhost', '127.0.0.1');
      console.log('APP_BASE_URL:', process.env.APP_BASE_URL);
    }
  });

  e2e
    .command('test')
    .allowUnknownOption()
    .option('--url [url]')
    .option('--build')
    .option('--production')
    .action(async (options) => {
      process.env.__E2E__ = true;
      if (options.production) {
        process.env.APP_ENV = 'production';
      }
      if (options.build) {
        process.env.APP_ENV = 'production';
        await run('yarn', ['build']);
      }
      if (options.url) {
        process.env.APP_BASE_URL = options.url.replace('localhost', '127.0.0.1');
      } else {
        await runApp({
          stdio: 'ignore',
        });
      }
      await appReady();
      await run('npx', ['playwright', 'test', ...filterArgv()]);
      process.exit();
    });

  e2e
    .command('codegen')
    .allowUnknownOption()
    .option('--url [url]')
    .action(async (options) => {
      if (options.url) {
        process.env.APP_BASE_URL = options.url.replace('localhost', '127.0.0.1');
      } else {
        await runApp({
          stdio: 'ignore',
        });
      }
      await appReady();
      runCodegenSync();
    });

  e2e
    .command('start-app')
    .option('--production')
    .option('--build')
    .option('--port [port]')
    .action(async (options) => {
      process.env.__E2E__ = true;
      if (options.build) {
        await run('yarn', ['build']);
      }
      if (options.production) {
        process.env.APP_ENV = 'production';
      }
      if (options.port) {
        process.env.APP_PORT = options.port;
      }
      runApp();
    });

  e2e.command('reinstall-app').action(async (options) => {
    await run('nocobase', ['install', '-f'], options);
    await run('nocobase', ['pm2', 'enable-all']);
  });

  e2e.command('install-deps').action(async () => {
    await run('npx', ['playwright', 'install', '--with-deps']);
  });

  e2e
    .command('p-test')
    .option('--stop-on-error')
    .option('--build')
    .option('--concurrency [concurrency]', '', os.cpus().length)
    .option(
      '--match [match]',
      'Only the files matching one of these patterns are executed as test files. Matching is performed against the absolute file path. Strings are treated as glob patterns.',
      'packages/**/__e2e__/**/*.test.ts',
    )
    .option('--ignore [ignore]', 'Skip tests that match the pattern. Strings are treated as glob patterns.', undefined)
    .action(async (options) => {
      process.env.__E2E__ = true;
      if (options.build) {
        process.env.APP_ENV = 'production';
        await run('yarn', ['build']);
      }
      await pTest({ ...options, concurrency: 1 * options.concurrency });
    });
};
