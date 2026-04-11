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

/**
 * Read an own property value from an object, invoking the getter if the property
 * is an accessor descriptor.  Returns undefined for write-only or throwing accessors.
 */
function resolveProperty(obj, key) {
  const desc = Object.getOwnPropertyDescriptor(obj, key);
  if (!desc) return undefined;
  if ('value' in desc) return desc.value;
  if (desc.get) {
    try {
      return desc.get.call(obj);
    } catch (_) {
      return undefined;
    }
  }
  return undefined;
}

/**
 * Recursively sanitize a value from the host realm before exposing it to the VM
 * sandbox context.
 *
 * Security guarantee: every function in the returned structure has its prototype
 * chain severed and its `constructor` property set to null via hardenFunction(),
 * so that sandbox code cannot traverse `fn.constructor` (or
 * `fn.constructor.constructor`) to reach the host Function constructor.
 *
 * All object values are re-created with a null prototype, removing the
 * `obj.constructor → host Object → Object.constructor → host Function` chain.
 *
 * Static properties on function-typed exports (e.g. `dayjs.extend`) are also
 * exposed on the wrapper so that user code can call them.
 *
 * Note: return values of wrapped functions are NOT further sanitized here.
 * The isolated-vm path (IsolatedVm.js) provides stronger isolation for deployments
 * that do not require module support.
 *
 * @param {*} val    - the host-realm value to sanitize
 * @param {*} parent - parent object used as `this` when binding methods
 * @param {WeakMap} [cache] - cycle-detection cache
 */
function sanitizeForSandbox(val, parent, cache) {
  if (!cache) cache = new WeakMap();

  // Primitives (string, number, boolean, bigint, symbol, null, undefined)
  // are realm-neutral — they carry no mutable prototype chain.
  if (val === null || val === undefined) return val;
  if (typeof val !== 'object' && typeof val !== 'function') return val;

  if (cache.has(val)) return cache.get(val);

  if (typeof val === 'function') {
    // Bind to parent so that methods relying on `this` keep working
    // (e.g. axios.get internally calls this.request).
    const fn = parent != null ? val.bind(parent) : val;
    const wrapper = function (...args) {
      return fn(...args);
    };
    cache.set(val, wrapper);
    hardenFunction(wrapper);

    // Expose static properties that may be present on function-typed exports
    // (e.g. dayjs.extend, lodash.chain, axios.create).
    const SKIP_PROPS = new Set(['length', 'name', 'prototype', 'caller', 'arguments', 'constructor']);
    for (const key of Object.getOwnPropertyNames(val)) {
      if (SKIP_PROPS.has(key)) continue;
      try {
        const resolved = resolveProperty(val, key);
        if (resolved !== undefined) {
          Object.defineProperty(wrapper, key, {
            value: sanitizeForSandbox(resolved, val, cache),
            writable: false,
            enumerable: true,
            configurable: false,
          });
        }
      } catch (_) {
        // skip non-readable / non-configurable properties
      }
    }
    return wrapper;
  }

  // Object: re-create as a null-prototype plain object and recurse on own properties.
  const clean = Object.create(null);
  cache.set(val, clean);
  for (const key of Object.getOwnPropertyNames(val)) {
    try {
      const resolved = resolveProperty(val, key);
      if (resolved !== undefined) {
        clean[key] = sanitizeForSandbox(resolved, val, cache);
      }
    } catch (_) {
      // skip non-readable properties
    }
  }
  return clean;
}

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
    // FIX (Vector 2): sanitize the module before handing it to the sandbox.
    // Without this, any function property on the returned module has
    // fn.constructor === host Function, enabling sandbox escape and RCE.
    return sanitizeForSandbox(require(m));
  }
  // FIX (Vector 1): do NOT throw a raw host-realm Error object.
  // A host Error's prototype chain (e.constructor → host Error → e.constructor.constructor
  // → host Function) allows the sandbox to obtain the host Function constructor and
  // achieve RCE. Instead, sever the prototype chain before throwing.
  const err = new Error(`module "${m}" not supported`);
  Object.setPrototypeOf(err, null);
  Object.defineProperty(err, 'constructor', {
    value: null,
    writable: false,
    enumerable: false,
    configurable: false,
  });
  throw err;
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
