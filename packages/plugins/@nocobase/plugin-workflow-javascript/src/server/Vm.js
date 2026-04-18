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
 * Sever the prototype chain of a host-realm value (function or object) so that
 * Object.getPrototypeOf(v).constructor cannot reach the host Function constructor.
 * Works on functions, plain objects, and Error instances alike; setPrototypeOf(null)
 * is a no-op when the prototype is already null.
 */
function harden(v) {
  Object.setPrototypeOf(v, null);
  Object.defineProperty(v, 'constructor', {
    value: null,
    writable: false,
    enumerable: false,
    configurable: false,
  });
  return v;
}

/**
 * Build a sandbox-safe Error. Used whenever an error originating in the host realm
 * needs to cross back into the sandbox — throwing a raw host Error would expose
 * e.constructor.constructor === host Function, enabling RCE.
 */
function createSandboxError(msg) {
  return harden(new Error(msg));
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
 * Sanitize a thrown value from the host realm so that its prototype chain cannot
 * be used to escape the sandbox.  The message is extracted as a primitive string,
 * then a fresh Error is created whose prototype chain is severed.
 */
function sanitizeError(e) {
  let msg;
  try {
    msg = e != null && typeof e.message === 'string' ? e.message : String(e);
  } catch (_) {
    msg = 'unknown error';
  }
  return createSandboxError(msg);
}

/**
 * Sanitize a value returned from a host-realm function call before it re-enters
 * the sandbox.  Handles both synchronous return values and Promises (thenables).
 *
 * For thenables, a clean null-prototype thenable is returned instead of the raw
 * host Promise.  Returning the host Promise directly would expose
 * p.constructor (→ host Promise) → p.constructor.constructor (→ host Function),
 * allowing sandbox escape.  The clean thenable intercepts both onFulfilled and
 * onRejected callbacks so that resolved values are sanitized and rejected errors
 * have their prototype chains severed before reaching sandbox code.
 */
function sanitizeReturnValue(result) {
  if (result === null || result === undefined) return result;
  if (typeof result !== 'object' && typeof result !== 'function') return result;

  if (typeof result.then === 'function') {
    // Build a null-prototype thenable that wraps the host Promise without
    // exposing its constructor chain.  `await cleanThenable` works because the
    // spec resolves thenables by calling cleanThenable.then(resolve, reject).
    const cleanThenable = Object.create(null);
    const originalThen = result.then.bind(result);
    Object.defineProperty(cleanThenable, 'then', {
      value: harden(function (onFulfilled, onRejected) {
        const next = originalThen(
          typeof onFulfilled === 'function'
            ? (v) => onFulfilled(sanitizeForSandbox(v, null, new WeakMap()))
            : onFulfilled,
          typeof onRejected === 'function' ? (e) => onRejected(sanitizeError(e)) : onRejected,
        );
        // Sanitize the chained Promise so that .then().then() chains are also clean.
        return sanitizeReturnValue(next);
      }),
      writable: false,
      enumerable: true,
      configurable: false,
    });
    return cleanThenable;
  }

  return sanitizeForSandbox(result, null, new WeakMap());
}

/**
 * Recursively sanitize a value from the host realm before exposing it to the VM
 * sandbox context.
 *
 * Security guarantee: every function in the returned structure has its prototype
 * chain severed and its `constructor` property set to null via harden(),
 * so that sandbox code cannot traverse `fn.constructor` (or
 * `fn.constructor.constructor`) to reach the host Function constructor.
 *
 * All object values are re-created with a null prototype, removing the
 * `obj.constructor → host Object → Object.constructor → host Function` chain.
 *
 * Function wrappers sanitize their return values (including Promise resolutions)
 * so that objects returned by module calls also have hardened prototype chains.
 *
 * Static properties on function-typed exports (e.g. `dayjs.extend`) are also
 * exposed on the wrapper so that user code can call them.
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
      let ret;
      try {
        ret = fn(...args);
      } catch (e) {
        // Sanitize host-realm exceptions before they reach the sandbox.
        // A raw host Error has e.constructor.constructor === host Function,
        // which allows sandbox escape and RCE.
        throw sanitizeError(e);
      }
      return sanitizeReturnValue(ret);
    };
    cache.set(val, wrapper);
    harden(wrapper);

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

  // Special-case Arrays: copy indexed elements + length, then attach a safe
  // Symbol.iterator so that for...of, spread ([...arr]), and destructuring
  // work in sandbox code.  We cannot return a real host Array because its
  // __proto__.constructor chain leads to the host Function constructor.
  // The iterator and its result objects are null-prototype plain objects —
  // they do not expose host-realm constructor chains at any level.
  if (Array.isArray(val)) {
    const len = val.length;
    const cleanArr = Object.create(null);
    cache.set(val, cleanArr);

    Object.defineProperty(cleanArr, 'length', {
      value: len,
      writable: false,
      enumerable: false,
      configurable: false,
    });

    for (let i = 0; i < len; i++) {
      try {
        cleanArr[i] = sanitizeForSandbox(val[i], null, cache);
      } catch (_) {
        // skip unreadable slots
      }
    }

    // Attach Symbol.iterator so for...of / spread / destructuring work.
    Object.defineProperty(cleanArr, Symbol.iterator, {
      value: harden(function () {
        let idx = 0;
        const iterator = Object.create(null);
        iterator.next = harden(function () {
          const result = Object.create(null);
          if (idx < len) {
            result.value = cleanArr[idx++];
            result.done = false;
          } else {
            result.value = undefined;
            result.done = true;
          }
          return result;
        });
        // The iterator is self-iterable (iterable iterator protocol).
        iterator[Symbol.iterator] = harden(function () {
          return iterator;
        });
        return iterator;
      }),
      writable: false,
      enumerable: false,
      configurable: false,
    });

    return cleanArr;
  }

  // Object: re-create as a null-prototype plain object and walk the prototype
  // chain up to (but excluding) Object.prototype so that inherited methods
  // are included (e.g. Hash.prototype.update, EventEmitter.prototype.on,
  // Readable.prototype.pipe).  Own properties always take precedence over
  // inherited ones (first-write wins).
  //
  // Security note: there is no depth cap.  Every copied value is re-sanitized
  // recursively, so any function on a deep prototype still gets harden()'d and
  // every object still becomes null-prototype.  The depth cap that previously
  // lived here did not add security; it only silently dropped methods on
  // deeper ancestors (e.g. hash.on via EventEmitter, stream.pipe via Readable).
  const clean = Object.create(null);
  cache.set(val, clean);

  let proto = val;
  while (proto !== null && proto !== Object.prototype) {
    for (const key of Object.getOwnPropertyNames(proto)) {
      if (key === 'constructor' || key in clean) continue;
      try {
        const resolved = resolveProperty(proto, key);
        if (resolved !== undefined) {
          // Always bind to the original `val` so `this` inside methods is correct.
          clean[key] = sanitizeForSandbox(resolved, val, cache);
        }
      } catch (_) {
        // skip non-readable properties
      }
    }
    proto = Object.getPrototypeOf(proto);
  }
  return clean;
}

function customRequire(m) {
  // Any exception that escapes this function re-enters the sandbox.  Raw host
  // errors have e.constructor.constructor === host Function, enabling RCE, so
  // wrap the whole body and funnel every throw path through sanitizeError:
  //   - explicit "not supported" / type errors below
  //   - TypeErrors from Path.isAbsolute / m.split when m is not a string
  //   - MODULE_NOT_FOUND from require() itself (e.g. require('fs/bogus') when
  //     'fs' is whitelisted but the subpath does not exist)
  try {
    if (typeof m !== 'string') {
      throw new Error('module name must be a string');
    }
    const configuredModules = (process.env.WORKFLOW_SCRIPT_MODULES?.split(',') ?? []).filter(Boolean);
    let mainName;
    if (Path.isAbsolute(m)) {
      mainName = m;
    } else if (m.startsWith('.')) {
      mainName = m;
      m = Path.resolve(process.cwd(), m);
    } else {
      mainName = m
        .split('/')
        .slice(0, m.startsWith('@') ? 2 : 1)
        .join('/');
    }
    if (configuredModules.includes(mainName)) {
      // Sanitize the module before handing it to the sandbox so that function
      // properties have fn.constructor === null.
      return sanitizeForSandbox(require(m));
    }
    throw new Error(`module "${m}" not supported`);
  } catch (e) {
    throw sanitizeError(e);
  }
}

harden(customRequire);

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
      const bound = harden(originalConsole[key].bind(originalConsole));
      Object.defineProperty(safe, key, {
        value: bound,
        writable: false,
        enumerable: true,
        configurable: false,
      });
    }
  }

  return Object.freeze(harden(safe));
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

/**
 * Normalize the script's return value to a plain JSON-compatible value before
 * sending it back to the host thread.
 *
 * Rationale: the job result is always stored in the database as JSON and
 * re-parsed by subsequent workflow nodes, so JavaScript-specific semantics
 * (prototype chains, Symbols, functions) have no meaning at this boundary.
 * A JSON round-trip:
 *  - converts any null-prototype objects left by sanitizeForSandbox into
 *    plain objects / proper Arrays that downstream code can use normally,
 *  - silently drops function-valued properties (expected for serialized data),
 *  - guarantees structured-clone compatibility for postMessage.
 * Primitives and null/undefined pass through unchanged.
 */
function toJsonResult(value) {
  if (value === null || value === undefined) return value;
  if (typeof value !== 'object' && typeof value !== 'function') return value;
  try {
    return JSON.parse(JSON.stringify(value));
  } catch (_) {
    // Non-JSON-serializable return value (e.g. circular ref, BigInt).
    // Fall back to the raw value; postMessage structured clone will either
    // handle it or throw its own DataCloneError.
    return value;
  }
}

// eslint-disable-next-line promise/catch-or-return
main()
  .then((result) => {
    parentPort.postMessage({ type: 'result', result: toJsonResult(result) });
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
