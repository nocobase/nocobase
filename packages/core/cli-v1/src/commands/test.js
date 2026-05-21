/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

const { Command } = require('commander');
const { run, checkDBDialect } = require('../util');
const path = require('path');
const fs = require('fs');

function stripSingleThreadArgs(argv) {
  const nextArgv = [];

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === '--single-thread') {
      const next = argv[index + 1];
      if (next && !next.startsWith('-')) {
        index += 1;
      }
      continue;
    }

    if (token.startsWith('--single-thread=')) {
      continue;
    }

    nextArgv.push(token);
  }

  return nextArgv;
}

function stripDelegatedWorkspaceArgs(argv, delegatedPath) {
  const nextArgv = [];
  const normalizedDelegatedPath = String(delegatedPath || '')
    .trim()
    .split(path.sep)
    .join('/');
  let skippedPath = false;

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    const normalizedToken = String(token || '')
      .trim()
      .split(path.sep)
      .join('/');

    if (
      !skippedPath &&
      normalizedDelegatedPath &&
      !token.startsWith('-') &&
      normalizedToken === normalizedDelegatedPath
    ) {
      skippedPath = true;
      continue;
    }

    if (token === '--server' || token === '--client') {
      continue;
    }

    if (token === '--single-thread') {
      const next = argv[index + 1];
      if (next && !next.startsWith('-')) {
        index += 1;
      }
      continue;
    }

    if (token.startsWith('--single-thread=')) {
      continue;
    }

    nextArgv.push(token);
  }

  return nextArgv;
}

function resolveWorkspaceTestDelegation(paths = [], argv = process.argv.slice(3), cwd = process.cwd()) {
  const firstPath = String(paths?.[0] || '').trim();
  if (!firstPath) {
    return undefined;
  }

  const packageDir = path.resolve(cwd, firstPath);
  if (packageDir === cwd) {
    return undefined;
  }

  const packageJsonPath = path.join(packageDir, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    return undefined;
  }

  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const testScript = String(packageJson?.scripts?.test || '').trim();
    if (!testScript) {
      return undefined;
    }

    return {
      packageDir,
      forwardedArgv: stripDelegatedWorkspaceArgs(argv, firstPath),
    };
  } catch (error) {
    return undefined;
  }
}

function requiresNoNodeSnapshot(nodeVersion = process.versions.node) {
  const major = Number.parseInt(String(nodeVersion).split('.')[0], 10);
  return Number.isFinite(major) && major >= 20;
}

function buildVitestNodeArgs(argv, nodeVersion = process.versions.node) {
  const cliArgs = ['--max_old_space_size=14096', './node_modules/vitest/vitest.mjs', ...stripSingleThreadArgs(argv)];

  // `isolated-vm` requires `--no-node-snapshot` on Node 20+.
  if (requiresNoNodeSnapshot(nodeVersion)) {
    cliArgs.unshift('--no-node-snapshot');
  }

  return cliArgs;
}

/**
 *
 * @param {String} name
 * @param {Command} cli
 */
function addTestCommand(name, cli) {
  return cli
    .command(name)
    .option('-w, --watch')
    .option('--run')
    .option('--allowOnly')
    .option('--bail')
    .option('--coverage')
    .option('-h, --help')
    .option('--single-thread [singleThread]')
    .arguments('[paths...]')
    .allowUnknownOption()
    .action(async (paths, opts) => {
      const delegation = name === 'test' ? resolveWorkspaceTestDelegation(paths, process.argv.slice(3)) : undefined;
      if (delegation) {
        await run('yarn', ['--cwd', delegation.packageDir, 'test', ...delegation.forwardedArgv]);
        return;
      }

      checkDBDialect();
      if (name === 'test:server') {
        process.env.TEST_ENV = 'server-side';
      } else if (name === 'test:client') {
        process.env.TEST_ENV = 'client-side';
      }
      if (opts.server) {
        process.env.TEST_ENV = 'server-side';
        process.argv.splice(process.argv.indexOf('--server'), 1);
      }

      if (opts.client) {
        process.env.TEST_ENV = 'client-side';
        process.argv.splice(process.argv.indexOf('--client'), 1);
      }

      process.env.NODE_ENV = 'test';

      if (!opts.watch && !opts.run) {
        process.argv.push('--run');
      }

      const first = paths?.[0];
      if (!process.env.TEST_ENV && first) {
        const key = first.split(path.sep).join('/');
        if (key.includes('/client/') || key.includes('/client-v2/') || key.includes('/flow-engine/')) {
          process.env.TEST_ENV = 'client-side';
        } else {
          process.env.TEST_ENV = 'server-side';
        }
      }

      if (process.env.TEST_ENV === 'server-side' && opts.singleThread !== 'false') {
        process.argv.push('--poolOptions.threads.singleThread=true');
      }

      const cliArgs = buildVitestNodeArgs(process.argv.slice(3));

      if (process.argv.includes('-h') || process.argv.includes('--help')) {
        await run(process.execPath, cliArgs);
        return;
      }

      if (process.env.TEST_ENV) {
        console.log('process.env.TEST_ENV', process.env.TEST_ENV, cliArgs);
        await run(process.execPath, cliArgs);
      } else {
        await Promise.all([
          run(process.execPath, cliArgs, {
            env: {
              TEST_ENV: 'client-side',
            },
          }),
          run(process.execPath, cliArgs, {
            env: {
              TEST_ENV: 'server-side',
            },
          }),
        ]);
      }
    });
}

/**
 *
 * @param {Command} cli
 */
module.exports = (cli) => {
  addTestCommand('test:server', cli);
  addTestCommand('test:client', cli);
  addTestCommand('test', cli).option('--client').option('--server');
};

module.exports._test = {
  stripSingleThreadArgs,
  stripDelegatedWorkspaceArgs,
  resolveWorkspaceTestDelegation,
  requiresNoNodeSnapshot,
  buildVitestNodeArgs,
};
