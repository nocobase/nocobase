/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import winston from 'winston';

import { JOB_STATUS } from '@nocobase/plugin-workflow';

import { CacheTransport } from '../cache-logger';
import ScriptInstruction from '../ScriptInstruction';

describe('workflow-javascript > security > vm context protections', () => {
  let transport: CacheTransport;
  let logger;

  beforeEach(() => {
    transport = new CacheTransport();
    logger = winston.createLogger({
      transports: [transport],
    });
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
});
