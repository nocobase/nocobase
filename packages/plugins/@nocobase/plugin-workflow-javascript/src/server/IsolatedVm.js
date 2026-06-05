/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

const { parentPort, workerData } = require('node:worker_threads');
const ivm = require('isolated-vm');

async function main() {
  const { source, args = {}, options = {} } = workerData;

  const isolate = new ivm.Isolate({ memoryLimit: 128 });

  try {
    const context = await isolate.createContext();
    const jail = context.global;

    // Inject console methods via callbacks.
    // ivm.Callback runs the function in the host context when called from within the isolate.
    // Arguments are automatically copied across the isolation boundary.
    const logCb = new ivm.Callback((...a) => console.log(...a));
    const warnCb = new ivm.Callback((...a) => console.warn(...a));
    const errorCb = new ivm.Callback((...a) => console.error(...a));

    await jail.set('__logCb', logCb);
    await jail.set('__warnCb', warnCb);
    await jail.set('__errorCb', errorCb);

    // Build console object and clean up temporary globals
    await context.eval(`
      const console = Object.freeze({
        log:            __logCb,
        info:           __logCb,
        warn:           __warnCb,
        error:          __errorCb,
        debug:          __logCb,
        trace:          __logCb,
        dir:            __logCb,
        dirxml:         __logCb,
        table:          __logCb,
        time:           function() {},
        timeEnd:        function() {},
        timeLog:        function() {},
        count:          function() {},
        countReset:     function() {},
        group:          function() {},
        groupCollapsed: function() {},
        groupEnd:       function() {},
        clear:          function() {},
        assert:         function(cond, ...a) { if (!cond) __errorCb('Assertion failed:', ...a); },
      });
      delete globalThis.__logCb;
      delete globalThis.__warnCb;
      delete globalThis.__errorCb;
    `);

    // Inject user-supplied arguments into the isolate context
    for (const [key, value] of Object.entries(args)) {
      // ExternalCopy handles structured-cloneable types (primitives, objects, arrays, Date, etc.)
      const val = value === undefined ? null : value;
      await jail.set(key, new ivm.ExternalCopy(val).copyInto());
    }

    const code = `
      (async function __main() {
        ${source}
      })()
    `;

    // isolated-vm natively supports timeout and promise resolution.
    // `copy: true` copies the result out of the isolate via structured clone.
    const result = await context.eval(code, {
      timeout: options.timeout || undefined,
      promise: true,
      copy: true,
    });

    return result;
  } finally {
    if (!isolate.isDisposed) {
      isolate.dispose();
    }
  }
}

// eslint-disable-next-line promise/catch-or-return
main()
  .then((result) => {
    parentPort.postMessage({ type: 'result', result });
  })
  .catch((error) => {
    throw error;
  });
