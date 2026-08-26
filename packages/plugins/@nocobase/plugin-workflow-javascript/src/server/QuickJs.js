/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

const { parentPort, workerData } = require('node:worker_threads');
const path = require('node:path');

function loadQuickJS() {
  const bundledPath = path.join(__dirname, '..', 'node_modules', 'quickjs-emscripten');
  try {
    return require(bundledPath);
  } catch (error) {
    const packageName = 'quickjs-emscripten';
    return require(packageName);
  }
}

const { getQuickJS } = loadQuickJS();

const MEMORY_LIMIT_BYTES = 128 * 1024 * 1024;
const MAX_STACK_SIZE_BYTES = 1024 * 1024;

const CONSOLE_BOOTSTRAP = `
  const console = Object.freeze({
    log:            globalThis.__logCb,
    info:           globalThis.__logCb,
    warn:           globalThis.__warnCb,
    error:          globalThis.__errorCb,
    debug:          globalThis.__logCb,
    trace:          globalThis.__logCb,
    dir:            globalThis.__logCb,
    dirxml:         globalThis.__logCb,
    table:          globalThis.__logCb,
    time:           function () {},
    timeEnd:        function () {},
    timeLog:        function () {},
    count:          function () {},
    countReset:     function () {},
    group:          function () {},
    groupCollapsed: function () {},
    groupEnd:       function () {},
    clear:          function () {},
    assert:         function (cond, ...a) { if (!cond) globalThis.__errorCb('Assertion failed:', ...a); },
  });
  delete globalThis.__logCb;
  delete globalThis.__warnCb;
  delete globalThis.__errorCb;
`;

function dumpErrorHandle(context, handle) {
  try {
    const value = context.dump(handle);
    if (value && typeof value === 'object' && typeof value.message === 'string') {
      return value.name ? `${value.name}: ${value.message}` : value.message;
    }
    return String(value);
  } finally {
    handle.dispose();
  }
}

async function main() {
  const { source, args = {}, options = {} } = workerData;

  const QuickJS = await getQuickJS();
  const runtime = QuickJS.newRuntime();
  runtime.setMemoryLimit(MEMORY_LIMIT_BYTES);
  runtime.setMaxStackSize(MAX_STACK_SIZE_BYTES);

  const deadline = options.timeout ? Date.now() + options.timeout : null;
  if (deadline !== null) {
    runtime.setInterruptHandler(() => Date.now() > deadline);
  }

  const context = runtime.newContext();

  try {
    const bindLog = (hostFn) =>
      context.newFunction('', (...argHandles) => {
        const values = argHandles.map((h) => context.dump(h));
        hostFn(...values);
      });

    // newFunction wraps the host closure as a QuickJS function value; guest
    // code cannot walk its prototype chain back to the host V8 realm, so the
    // Vm.js hardenFunction / createSafeConsole defenses are not needed here.
    const logFn = bindLog((...a) => console.log(...a));
    const warnFn = bindLog((...a) => console.warn(...a));
    const errorFn = bindLog((...a) => console.error(...a));
    context.setProp(context.global, '__logCb', logFn);
    context.setProp(context.global, '__warnCb', warnFn);
    context.setProp(context.global, '__errorCb', errorFn);
    logFn.dispose();
    warnFn.dispose();
    errorFn.dispose();

    let argsJson;
    try {
      argsJson = JSON.stringify(args ?? {}, (_, v) => (v === undefined ? null : v));
    } catch (error) {
      throw new Error('Script arguments must be JSON-serializable', { cause: error });
    }
    const argsHandle = context.newString(argsJson);
    context.setProp(context.global, '__argsJson', argsHandle);
    argsHandle.dispose();

    const bootstrap = `
      ${CONSOLE_BOOTSTRAP}
      (function () {
        const __a = JSON.parse(globalThis.__argsJson);
        for (const k of Object.keys(__a)) globalThis[k] = __a[k];
        delete globalThis.__argsJson;
      })();
    `;
    const setupResult = context.evalCode(bootstrap, 'bootstrap.js');
    context.unwrapResult(setupResult).dispose();

    const wrappedSource = `(async function __main() {\n${source ?? ''}\n})()`;
    const runResult = context.evalCode(wrappedSource, 'script.js');
    const promiseHandle = context.unwrapResult(runResult);
    try {
      // The async IIFE body is queued as a microtask; drain until the promise
      // settles. Only native QuickJS promises are reachable from user code, so
      // iterating executePendingJobs is sufficient.
      while (true) {
        const state = context.getPromiseState(promiseHandle);
        if (state.type === 'fulfilled') {
          const valueHandle = state.value;
          try {
            return context.dump(valueHandle);
          } finally {
            valueHandle.dispose();
          }
        }
        if (state.type === 'rejected') {
          throw new Error(dumpErrorHandle(context, state.error));
        }
        const pending = runtime.executePendingJobs();
        if (pending.error) {
          const message = dumpErrorHandle(context, pending.error);
          throw new Error(message);
        }
        if (pending.value === 0) {
          // No more jobs to run but promise still pending — deadlock
          // (e.g. user script awaits a promise that never settles).
          throw new Error('Script promise did not settle');
        }
      }
    } finally {
      promiseHandle.dispose();
    }
  } finally {
    context.dispose();
    runtime.dispose();
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
