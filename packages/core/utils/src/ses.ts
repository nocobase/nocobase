/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { LockdownOptions } from 'ses';
import 'ses';

const SES_LOCK_FLAG = Symbol.for('nocobase.utils.sesLockdown');
const BUFFER_OVERRIDE_FLAG = Symbol.for('nocobase.utils.bufferOverrides');

export const BASE_BLOCKED_IDENTIFIERS = [
  'globalThis',
  'global',
  'self',
  'Function',
  'AsyncFunction',
  'GeneratorFunction',
  'eval',
  'Compartment',
  'lockdown',
  'harden',
  'assert',
];

function isAlreadyLockedError(error: unknown) {
  if (!error || typeof error !== 'object') {
    return false;
  }
  const message = (error as Error).message || '';
  return message.includes('(SES_ALREADY_LOCKED_DOWN)');
}

function enableBufferPrototypeOverrides() {
  const globalRef = globalThis as Record<string | symbol, any>;
  if (globalRef[BUFFER_OVERRIDE_FLAG]) {
    return;
  }

  const bufferCtor = globalRef.Buffer as typeof Buffer | undefined;
  if (!bufferCtor || !bufferCtor.prototype) {
    return;
  }

  const bufferPrototype = bufferCtor.prototype;
  for (const key of Reflect.ownKeys(bufferPrototype)) {
    const descriptor = Object.getOwnPropertyDescriptor(bufferPrototype, key);
    if (!descriptor || typeof descriptor.value !== 'function' || !descriptor.configurable) {
      continue;
    }

    const original = descriptor.value;
    const getter = function () {
      return original;
    };
    const setter = function (this: unknown, value: unknown) {
      if (this === bufferPrototype) {
        throw new TypeError(`Cannot assign to read only property '${String(key)}' of object 'Buffer.prototype'`);
      }
      Object.defineProperty(this as object, key, {
        configurable: true,
        enumerable: true,
        writable: true,
        value,
      });
    };

    Object.defineProperty(getter, 'originalValue', {
      configurable: false,
      enumerable: false,
      writable: false,
      value: original,
    });

    Object.defineProperty(bufferPrototype, key, {
      configurable: descriptor.configurable,
      enumerable: descriptor.enumerable,
      get: getter,
      set: setter,
    });
  }

  globalRef[BUFFER_OVERRIDE_FLAG] = true;
}

export function lockdownSes(options?: LockdownOptions) {
  // mysql2 mutates Buffer instances when mocking packets; run the shim before lockdown.
  enableBufferPrototypeOverrides();

  const globalRef = globalThis as Record<string | symbol, any>;
  if (globalRef[SES_LOCK_FLAG]) {
    return;
  }
  if (typeof lockdown !== 'function') {
    throw new Error('SES lockdown is unavailable in the current runtime environment.');
  }
  try {
    lockdown(options);
  } catch (error) {
    if (!isAlreadyLockedError(error)) {
      throw error;
    }
  }
  globalRef[SES_LOCK_FLAG] = true;
}
