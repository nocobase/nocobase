/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import path from 'path';

import winston from 'winston';

import { JOB_STATUS } from '@nocobase/plugin-workflow';

import { CacheTransport } from '../cache-logger';
import ScriptInstruction from '../ScriptInstruction';

describe('workflow-javascript > security > isolated-vm (default engine)', () => {
  let transport: CacheTransport;
  let logger;
  let originalModules;

  beforeEach(() => {
    originalModules = process.env.WORKFLOW_SCRIPT_MODULES;
    delete process.env.WORKFLOW_SCRIPT_MODULES;
    transport = new CacheTransport();
    logger = winston.createLogger({
      transports: [transport],
    });
  });

  afterEach(() => {
    if (originalModules !== undefined) {
      process.env.WORKFLOW_SCRIPT_MODULES = originalModules;
    }
  });

  it('should not have require available', async () => {
    const script = `
      try {
        const fs = require('fs');
        return { hasRequire: true };
      } catch (e) {
        return { hasRequire: false, error: e.message };
      }
    `;

    const result = await ScriptInstruction.run(script, {}, { logger });

    expect(result.status).toBe(JOB_STATUS.RESOLVED);
    expect(result.result.hasRequire).toBe(false);
  });

  it('should not have access to process', async () => {
    const script = `
      try {
        return { hasProcess: typeof process !== 'undefined', pid: process?.pid };
      } catch (e) {
        return { hasProcess: false, error: e.message };
      }
    `;

    const result = await ScriptInstruction.run(script, {}, { logger });

    expect(result.status).toBe(JOB_STATUS.RESOLVED);
    expect(result.result.hasProcess).toBe(false);
  });

  it('should not have access to Node.js globals', async () => {
    const script = `
      return {
        hasBuffer: typeof Buffer !== 'undefined',
        hasSetImmediate: typeof setImmediate !== 'undefined',
        hasClearImmediate: typeof clearImmediate !== 'undefined',
        hasGlobal: typeof global !== 'undefined',
      };
    `;

    const result = await ScriptInstruction.run(script, {}, { logger });

    expect(result.status).toBe(JOB_STATUS.RESOLVED);
    expect(result.result.hasBuffer).toBe(false);
    expect(result.result.hasSetImmediate).toBe(false);
    expect(result.result.hasClearImmediate).toBe(false);
    expect(result.result.hasGlobal).toBe(false);
  });

  it('should not expose host-realm objects via console._stdout', async () => {
    const script = `
      const hasStdout = typeof console._stdout !== 'undefined';
      const hasStderr = typeof console._stderr !== 'undefined';
      return { hasStdout, hasStderr };
    `;

    const result = await ScriptInstruction.run(script, {}, { logger });

    expect(result.status).toBe(JOB_STATUS.RESOLVED);
    expect(result.result.hasStdout).toBe(false);
    expect(result.result.hasStderr).toBe(false);
  });

  it('should support console.log', async () => {
    const script = `
      console.log('isolated-vm-check');
      return 'ok';
    `;

    const result = await ScriptInstruction.run(script, {}, { logger });

    expect(result.status).toBe(JOB_STATUS.RESOLVED);
    expect(result.result).toBe('ok');
    expect(transport.getLogs()).toContain('isolated-vm-check\n');
  });

  it('should handle arguments correctly', async () => {
    const script = `
      return { a: a, b: b };
    `;

    const result = await ScriptInstruction.run(script, { a: 1, b: 'hello' }, { logger });

    expect(result.status).toBe(JOB_STATUS.RESOLVED);
    expect(result.result).toEqual({ a: 1, b: 'hello' });
  });

  it('should support async/await', async () => {
    const script = `
      const a = await Promise.resolve(10);
      const b = await Promise.resolve(20);
      return a + b;
    `;

    const result = await ScriptInstruction.run(script, {}, { logger });

    expect(result.status).toBe(JOB_STATUS.RESOLVED);
    expect(result.result).toBe(30);
  });
});

describe('workflow-javascript > security > node vm engine (WORKFLOW_SCRIPT_MODULES set)', () => {
  let transport: CacheTransport;
  let logger;
  let originalModules;

  beforeEach(() => {
    originalModules = process.env.WORKFLOW_SCRIPT_MODULES;
    // Setting WORKFLOW_SCRIPT_MODULES triggers the node vm engine.
    // fs is included so that Promise-returning module APIs can be tested.
    process.env.WORKFLOW_SCRIPT_MODULES = 'path,crypto,fs';
    transport = new CacheTransport();
    logger = winston.createLogger({
      transports: [transport],
    });
  });

  afterEach(() => {
    if (originalModules !== undefined) {
      process.env.WORKFLOW_SCRIPT_MODULES = originalModules;
    } else {
      delete process.env.WORKFLOW_SCRIPT_MODULES;
    }
  });

  it('should mask constructors exposed to workflow scripts', async () => {
    const script = `
      console.log('security-check');
      return {
        globalCtor: globalThis.constructor ?? null,
        requireCtor: require.constructor ?? null,
        consoleCtor: console.constructor ?? null,
        consoleLogCtor: console.log.constructor ?? null,
        consoleProtoIsNull: Object.getPrototypeOf(console) === null,
      };
    `;

    const result = await ScriptInstruction.run(script, {}, { logger });

    expect(result.status).toBe(JOB_STATUS.RESOLVED);
    expect(result.result).toEqual({
      globalCtor: null,
      requireCtor: null,
      consoleCtor: null,
      consoleLogCtor: null,
      consoleProtoIsNull: true,
    });
    expect(transport.getLogs()).toContain('security-check\n');
  });

  it('should not expose host-realm objects via console._stdout (CVE: prototype chain traversal)', async () => {
    const script = `
      // CVE attack vector: console._stdout is a host-realm WritableWorkerStdio object.
      // Its constructor chain leads back to host realm's Function constructor,
      // which can be used to escape the sandbox and execute arbitrary code.
      const hasStdout = typeof console._stdout !== 'undefined';
      const hasStderr = typeof console._stderr !== 'undefined';

      let canEscapeViaStdout = false;
      let canEscapeViaStderr = false;

      try {
        const Fn = console._stdout.constructor.constructor;
        // If we can get host Function constructor, the sandbox is broken
        canEscapeViaStdout = typeof Fn === 'function' && typeof Fn('return 1')() === 'number';
      } catch (e) {
        canEscapeViaStdout = false;
      }

      try {
        const Fn = console._stderr.constructor.constructor;
        canEscapeViaStderr = typeof Fn === 'function' && typeof Fn('return 1')() === 'number';
      } catch (e) {
        canEscapeViaStderr = false;
      }

      return {
        hasStdout,
        hasStderr,
        canEscapeViaStdout,
        canEscapeViaStderr,
      };
    `;

    const result = await ScriptInstruction.run(script, {}, { logger });

    expect(result.status).toBe(JOB_STATUS.RESOLVED);
    // _stdout and _stderr should not be accessible in the sandbox
    expect(result.result.hasStdout).toBe(false);
    expect(result.result.hasStderr).toBe(false);
    // Even if somehow accessible, should not allow prototype chain escape
    expect(result.result.canEscapeViaStdout).toBe(false);
    expect(result.result.canEscapeViaStderr).toBe(false);
  });

  it('should not allow sandbox escape to obtain process object via console._stdout', async () => {
    // This is the exact exploit chain from the CVE report
    const script = `
      try {
        const RealFn = console._stdout.constructor.constructor;
        const proc = RealFn('return process')();
        // If we reach here, sandbox is broken - attacker has process object
        return {
          escaped: true,
          hasProcess: typeof proc !== 'undefined',
          pid: proc?.pid,
        };
      } catch (e) {
        return {
          escaped: false,
          error: e.message,
        };
      }
    `;

    const result = await ScriptInstruction.run(script, {}, { logger });

    expect(result.status).toBe(JOB_STATUS.RESOLVED);
    expect(result.result.escaped).toBe(false);
  });

  it('should not allow RCE via console._stdout prototype chain traversal', async () => {
    // Full RCE exploit from CVE report - should be blocked
    const script = `
      try {
        const RealFn = console._stdout.constructor.constructor;
        const proc = RealFn('return process')();
        const cp = proc.mainModule.require('child_process');
        const output = cp.execSync('echo pwned').toString().trim();
        return { rce: true, output };
      } catch (e) {
        return { rce: false, error: e.message };
      }
    `;

    const result = await ScriptInstruction.run(script, {}, { logger });

    expect(result.status).toBe(JOB_STATUS.RESOLVED);
    expect(result.result.rce).toBe(false);
  });

  it('should not expose any non-function properties from console that could leak host objects', async () => {
    const script = `
      const keys = Object.getOwnPropertyNames(console);
      const nonFunctionKeys = keys.filter(k => typeof console[k] !== 'function' && k !== 'constructor');
      const leakableKeys = [];

      for (const key of nonFunctionKeys) {
        try {
          const val = console[key];
          if (val && typeof val === 'object' && val.constructor && val.constructor.constructor) {
            const Fn = val.constructor.constructor;
            if (typeof Fn === 'function') {
              leakableKeys.push(key);
            }
          }
        } catch (e) {
          // blocked, good
        }
      }

      return {
        nonFunctionKeys,
        leakableKeys,
      };
    `;

    const result = await ScriptInstruction.run(script, {}, { logger });

    expect(result.status).toBe(JOB_STATUS.RESOLVED);
    // No non-function properties should be able to leak host-realm constructors
    expect(result.result.leakableKeys).toEqual([]);
  });

  it('should not allow escape via Object.getPrototypeOf(require).constructor', async () => {
    // require is a host-realm function; its prototype chain leads to host Function
    const script = `
      try {
        const proto = Object.getPrototypeOf(require);
        if (proto === null) return { escaped: false, protoIsNull: true };
        const Fn = proto.constructor;
        const proc = Fn('return process')();
        return { escaped: true, pid: proc.pid };
      } catch (e) {
        return { escaped: false, error: e.message };
      }
    `;

    const result = await ScriptInstruction.run(script, {}, { logger });

    expect(result.status).toBe(JOB_STATUS.RESOLVED);
    expect(result.result.escaped).toBe(false);
  });

  it('should not allow sandbox escape via Error thrown by customRequire (Vector 1: Error prototype chain)', async () => {
    // Attack: customRequire throws a host-realm Error; sandbox catches it and
    // traverses e.constructor.constructor to reach the host Function constructor.
    const script = `
      try {
        require('__nonexistent_module__');
      } catch (e) {
        try {
          const F = e.constructor.constructor;
          const proc = F('return process')();
          return { escaped: true, pid: proc?.pid };
        } catch (e2) {
          return { escaped: false, constructorIsNull: e.constructor === null, detail: String(e2) };
        }
      }
      return { escaped: false, reason: 'no error thrown' };
    `;

    const result = await ScriptInstruction.run(script, {}, { logger });

    expect(result.status).toBe(JOB_STATUS.RESOLVED);
    expect(result.result.escaped).toBe(false);
    expect(result.result.constructorIsNull).toBe(true);
  });

  it('should not allow sandbox escape via module function constructor (Vector 2: fn.constructor)', async () => {
    // Attack: a module returned by customRequire is a host-realm object; any
    // function property has fn.constructor === host Function constructor.
    const script = `
      try {
        const path = require('path');
        const F = path.join.constructor;
        if (!F) return { escaped: false, reason: 'constructor is null/falsy' };
        const proc = F('return process')();
        return { escaped: true, pid: proc?.pid };
      } catch (e) {
        return { escaped: false, error: String(e) };
      }
    `;

    const result = await ScriptInstruction.run(script, {}, { logger });

    expect(result.status).toBe(JOB_STATUS.RESOLVED);
    expect(result.result.escaped).toBe(false);
  });

  it('should reproduce the exact PoC from the CVE report and block it (Vector 1 full RCE chain)', async () => {
    // Full RCE exploit chain from the report:
    //   catch host Error → e.constructor.constructor → host Function
    //   → Function('return process')() → process.binding('spawn_sync').spawn(...)
    const script = `
      try {
        require('__nonexistent__');
      } catch(e) {
        try {
          const F = e.constructor.constructor;
          const p = F('return process')();
          const s = p.binding('spawn_sync');
          const r = s.spawn({
            file: '/bin/sh',
            args: ['/bin/sh', '-c', 'id'],
            stdio: [
              { type: 'pipe', readable: true,  writable: false },
              { type: 'pipe', readable: false, writable: true  },
              { type: 'pipe', readable: false, writable: true  }
            ]
          });
          return { rce: true, output: r.output[1].toString().trim() };
        } catch (e2) {
          return { rce: false, error: String(e2) };
        }
      }
      return { rce: false, reason: 'no error thrown' };
    `;

    const result = await ScriptInstruction.run(script, {}, { logger });

    expect(result.status).toBe(JOB_STATUS.RESOLVED);
    expect(result.result.rce).toBe(false);
  });

  it('should reproduce the exact PoC from the CVE report and block it (Vector 2 full RCE chain)', async () => {
    // Full RCE exploit chain via module function constructor:
    //   path.join.constructor → host Function → Function('return process')()
    const script = `
      try {
        const path = require('path');
        const F = path.join.constructor;
        if (!F) return { rce: false, reason: 'constructor is null' };
        const p = F('return process')();
        const s = p.binding('spawn_sync');
        const r = s.spawn({
          file: '/bin/sh',
          args: ['/bin/sh', '-c', 'id'],
          stdio: [
            { type: 'pipe', readable: true,  writable: false },
            { type: 'pipe', readable: false, writable: true  },
            { type: 'pipe', readable: false, writable: true  }
          ]
        });
        return { rce: true, output: r.output[1].toString().trim() };
      } catch (e) {
        return { rce: false, error: String(e) };
      }
    `;

    const result = await ScriptInstruction.run(script, {}, { logger });

    expect(result.status).toBe(JOB_STATUS.RESOLVED);
    expect(result.result.rce).toBe(false);
  });

  it('module should remain functional after sanitization (path.join)', async () => {
    const script = `
      const path = require('path');
      return {
        join: path.join('/a', 'b', 'c'),
        resolve: typeof path.resolve === 'function',
        constructorIsNull: path.join.constructor === null,
      };
    `;

    const result = await ScriptInstruction.run(script, {}, { logger });

    expect(result.status).toBe(JOB_STATUS.RESOLVED);
    expect(result.result.join).toBe(path.join('/a', 'b', 'c'));
    expect(result.result.resolve).toBe(true);
    expect(result.result.constructorIsNull).toBe(true);
  });

  it('should not allow escape via Object.getPrototypeOf(console.log).constructor', async () => {
    // Bound functions retain host-realm prototype chain
    const script = `
      try {
        const proto = Object.getPrototypeOf(console.log);
        if (proto === null) return { escaped: false, protoIsNull: true };
        const Fn = proto.constructor;
        const proc = Fn('return process')();
        return { escaped: true, pid: proc.pid };
      } catch (e) {
        return { escaped: false, error: e.message };
      }
    `;

    const result = await ScriptInstruction.run(script, {}, { logger });

    expect(result.status).toBe(JOB_STATUS.RESOLVED);
    expect(result.result.escaped).toBe(false);
  });

  it('should not allow escape via Error.prepareStackTrace and CallSite.getThis()', async () => {
    // V8 CallSite API can return host-realm objects from stack frames
    const script = `
      try {
        let hostObj;
        const original = Error.prepareStackTrace;
        Error.prepareStackTrace = (err, stack) => {
          for (const frame of stack) {
            try {
              const receiver = frame.getThis();
              if (receiver && typeof receiver === 'object') {
                hostObj = receiver;
                break;
              }
            } catch (e) {}
          }
          return '';
        };
        new Error().stack;
        Error.prepareStackTrace = original;

        if (!hostObj) return { escaped: false, reason: 'no host object found' };

        // Try to traverse prototype chain from the host object
        let current = hostObj;
        for (let i = 0; i < 10; i++) {
          if (current.constructor && current.constructor !== current) {
            try {
              const Fn = current.constructor.constructor || current.constructor;
              const proc = Fn('return process')();
              if (proc && proc.pid) {
                return { escaped: true, pid: proc.pid };
              }
            } catch (e) {}
          }
          const proto = Object.getPrototypeOf(current);
          if (!proto || proto === current) break;
          current = proto;
        }
        return { escaped: false, reason: 'could not traverse to Function' };
      } catch (e) {
        return { escaped: false, error: e.message };
      }
    `;

    const result = await ScriptInstruction.run(script, {}, { logger });

    expect(result.status).toBe(JOB_STATUS.RESOLVED);
    expect(result.result.escaped).toBe(false);
  });

  it('should not allow escape via exception thrown by an allowed module function (P1.1: module throw)', async () => {
    // Attack: call a whitelist-module function with bad args so it throws a
    // host-realm Error, then traverse e.constructor.constructor → host Function.
    // Example: path.join(null) throws TypeError in the host realm.
    const script = `
      try {
        const path = require('path');
        path.join(null);  // throws host TypeError
      } catch (e) {
        try {
          const F = e.constructor.constructor;
          if (!F) return { escaped: false, reason: 'constructor is null' };
          const proc = F('return process')();
          return { escaped: true, pid: proc?.pid };
        } catch (e2) {
          return { escaped: false, constructorIsNull: e.constructor === null, detail: String(e2) };
        }
      }
      return { escaped: false, reason: 'no error thrown' };
    `;

    const result = await ScriptInstruction.run(script, {}, { logger });

    expect(result.status).toBe(JOB_STATUS.RESOLVED);
    expect(result.result.escaped).toBe(false);
    expect(result.result.constructorIsNull).toBe(true);
  });

  it('should not allow escape via Promise returned by an allowed module (P1.2: host Promise constructor)', async () => {
    // Attack: an async module API returns a host Promise; p.constructor is the
    // host Promise constructor, and p.constructor.constructor is host Function.
    // Example: require('fs').promises.readdir('.') returns a native Promise.
    const script = `
      try {
        const fs = require('fs');
        const p = fs.promises.readdir('.');
        // Before awaiting, inspect the promise's constructor chain
        const PromiseCtor = p.constructor;
        if (!PromiseCtor) return { escaped: false, reason: 'constructor is null/falsy' };
        const F = PromiseCtor.constructor;
        if (!F) return { escaped: false, reason: 'Promise.constructor is null/falsy' };
        const proc = F('return process')();
        return { escaped: true, pid: proc?.pid };
      } catch (e) {
        return { escaped: false, error: String(e) };
      }
    `;

    const result = await ScriptInstruction.run(script, {}, { logger });

    expect(result.status).toBe(JOB_STATUS.RESOLVED);
    expect(result.result.escaped).toBe(false);
  });

  it('Promise-returning module functions should still work after sanitization (fs.promises.readdir)', async () => {
    // Functional regression: async module APIs must still return usable thenables.
    // Within the script, module-returned arrays are null-proto objects for security
    // (raw host Arrays expose __proto__.constructor → host Function → RCE), so:
    //   - for...of and spread work via the safe Symbol.iterator we attach
    //   - Array.isArray() inside the script returns false
    // The *return value* goes through toJsonResult() (JSON round-trip) before
    // postMessage, so the caller receives a proper JSON Array and Array.isArray
    // on result.result is true.
    const script = `
      const fs = require('fs');
      const entries = await fs.promises.readdir('.');
      // Within-script: for...of works via Symbol.iterator
      let count = 0;
      for (const entry of entries) {
        if (typeof entry === 'string') count++;
      }
      // Spread also works; the produced sandbox Array is returned as the result
      const arr = [...entries];
      return arr;
    `;

    const result = await ScriptInstruction.run(script, {}, { logger });

    expect(result.status).toBe(JOB_STATUS.RESOLVED);
    // After JSON round-trip at postMessage boundary, result is a proper Array
    expect(Array.isArray(result.result)).toBe(true);
    expect(result.result.length).toBeGreaterThan(0);
    expect(typeof result.result[0]).toBe('string');
  });

  it('should not allow escape via object returned from a module function (V2c: crypto.createHash)', async () => {
    // Reporter's exact bypass: sanitizeForSandbox wraps module functions but
    // the object they *return* must also be sanitized, otherwise
    //   hash.update.constructor === host Function → RCE.
    const script = `
      const crypto = require('crypto');
      const h = crypto.createHash('sha256');
      let escaped = false;
      try {
        const F = h.update.constructor;
        if (F) {
          const proc = F('return process')();
          escaped = Boolean(proc && proc.pid);
        }
      } catch (_) {}
      return {
        escaped,
        updateCtorIsNull: h.update.constructor === null,
        hashProtoIsNull: Object.getPrototypeOf(h) === null,
      };
    `;

    const result = await ScriptInstruction.run(script, {}, { logger });

    expect(result.status).toBe(JOB_STATUS.RESOLVED);
    expect(result.result.escaped).toBe(false);
    expect(result.result.updateCtorIsNull).toBe(true);
    expect(result.result.hashProtoIsNull).toBe(true);
  });

  it('crypto.createHash should remain functional end-to-end after sanitization', async () => {
    const script = `
      const crypto = require('crypto');
      const h = crypto.createHash('sha256');
      h.update('hello');
      return { digest: h.digest('hex') };
    `;

    const result = await ScriptInstruction.run(script, {}, { logger });

    expect(result.status).toBe(JOB_STATUS.RESOLVED);
    // sha256('hello')
    expect(result.result.digest).toBe('2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824');
  });

  it('deep-prototype methods on module objects remain callable (EventEmitter.on on a Hash)', async () => {
    // Regression for the previous MAX_PROTO_DEPTH cap: EventEmitter.on lives
    // several prototypes up from a Hash instance.  With the cap removed, the
    // sandbox must still see it as a hardened function.
    const script = `
      const crypto = require('crypto');
      const h = crypto.createHash('sha256');
      return {
        hasOn: typeof h.on === 'function',
        onCtorIsNull: typeof h.on === 'function' ? h.on.constructor === null : null,
      };
    `;

    const result = await ScriptInstruction.run(script, {}, { logger });

    expect(result.status).toBe(JOB_STATUS.RESOLVED);
    expect(result.result.hasOn).toBe(true);
    expect(result.result.onCtorIsNull).toBe(true);
  });

  it('should not allow escape via require() called with non-string argument (V3: arg-validation error)', async () => {
    // Path.isAbsolute / m.split would previously throw a raw host TypeError
    // when m is not a string, exposing e.constructor.constructor === host Function.
    const script = `
      const cases = [null, undefined, 42, {}, []];
      const results = [];
      for (const c of cases) {
        try { require(c); results.push({ threw: false }); }
        catch (e) { results.push({ threw: true, ctorIsNull: e.constructor === null }); }
      }
      return results;
    `;

    const result = await ScriptInstruction.run(script, {}, { logger });

    expect(result.status).toBe(JOB_STATUS.RESOLVED);
    for (const r of result.result) {
      expect(r.threw).toBe(true);
      expect(r.ctorIsNull).toBe(true);
    }
  });

  it('should not allow escape via require() of missing submodule under a whitelisted package (V3: MODULE_NOT_FOUND)', async () => {
    // WORKFLOW_SCRIPT_MODULES=fs — mainName='fs' is whitelisted, but the
    // subpath does not exist.  Node's MODULE_NOT_FOUND must not reach the
    // sandbox as a raw host Error.
    const script = `
      try {
        require('fs/__definitely_not_a_real_subpath__');
        return { escaped: false, reason: 'no error thrown' };
      } catch (e) {
        try {
          const F = e.constructor.constructor;
          const proc = F('return process')();
          return { escaped: true, pid: proc?.pid };
        } catch (_) {
          return { escaped: false, ctorIsNull: e.constructor === null };
        }
      }
    `;

    const result = await ScriptInstruction.run(script, {}, { logger });

    expect(result.status).toBe(JOB_STATUS.RESOLVED);
    expect(result.result.escaped).toBe(false);
    expect(result.result.ctorIsNull).toBe(true);
  });
});
