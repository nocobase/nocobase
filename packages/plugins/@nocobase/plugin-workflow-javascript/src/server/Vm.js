/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

const { parentPort, workerData } = require('node:worker_threads');
const { Script } = require('node:vm');
const Path = require('node:path');

let timer = null;

function customRequire(m) {
  const configuredModules = (process.env.WORKFLOW_SCRIPT_MODULES?.split(',') ?? []).filter(Boolean);
  let mainName;
  if (Path.isAbsolute(m)) {
    // absolute path
    mainName = m;
  } else if (m.startsWith('.')) {
    // relative path
    mainName = m;
    m = Path.resolve(process.cwd(), m);
  } else {
    mainName = m
      .split('/')
      .slice(0, m.startsWith('@') ? 2 : 1)
      .join('/');
  }
  if (configuredModules.includes(mainName)) {
    return require(m);
  }
  throw new Error(`module "${m}" not supported`);
}

/**
 * Sever the prototype chain of a host-realm function so that
 * Object.getPrototypeOf(fn).constructor cannot reach the host Function constructor.
 */
function hardenFunction(fn) {
  Object.setPrototypeOf(fn, null);
  Object.defineProperty(fn, 'constructor', {
    value: null,
    writable: false,
    enumerable: false,
    configurable: false,
  });
  return fn;
}

hardenFunction(customRequire);

/**
 * Create a safe console proxy that only exposes whitelisted logging methods.
 * Internal properties like _stdout, _stderr, _times are NOT exposed to prevent
 * prototype chain traversal attacks (CVE: sandbox escape via WritableWorkerStdio).
 */
function createSafeConsole(originalConsole) {
  const safe = Object.create(null);

  // Whitelist: only expose pure logging methods, no internal stream objects
  const allowedMethods = [
    'log',
    'info',
    'warn',
    'error',
    'debug',
    'trace',
    'dir',
    'dirxml',
    'table',
    'time',
    'timeEnd',
    'timeLog',
    'count',
    'countReset',
    'group',
    'groupCollapsed',
    'groupEnd',
    'clear',
    'assert',
  ];

  for (const key of allowedMethods) {
    if (typeof originalConsole[key] === 'function') {
      const bound = originalConsole[key].bind(originalConsole);
      hardenFunction(bound);
      Object.defineProperty(safe, key, {
        value: bound,
        writable: false,
        enumerable: true,
        configurable: false,
      });
    }
  }

  Object.defineProperty(safe, 'constructor', {
    value: null,
    writable: false,
    enumerable: false,
    configurable: false,
  });

  return Object.freeze(safe);
}

async function main() {
  const { source, args = {}, options = {} } = workerData;
  const code = `
    this.constructor = null;
    async function __main() {
      ${source}
    }
    __main();
  `;
  const script = new Script(code);
  const context = {
    ...args,
    require: customRequire,
    console: createSafeConsole(console),
  };

  if (options.timeout) {
    timer = setTimeout(() => {
      throw new Error(`Script execution timed out after ${options.timeout}ms`);
    }, options.timeout);
  }

  const result = script.runInNewContext(context, { timeout: options.timeout });

  return result;
}

// eslint-disable-next-line promise/catch-or-return
main()
  .then((result) => {
    parentPort.postMessage({ type: 'result', result });
    // NOTE: due to `process.exit()` will break stdout, it should not be called
    // see: https://nodejs.org/api/process.html#processexitcode
  })
  .catch((error) => {
    throw error;
  })
  .finally(() => {
    clearTimeout(timer);
    timer = null;
  });
