/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Registry } from '@nocobase/utils';

import { Evaluator } from '../utils';
import mathjs from '../utils/mathjs';
import { createFormulaEvaluator } from '../utils/formulajs';
import string from '../utils/string';

export { Evaluator, evaluate, appendArrayColumn } from '../utils';

export const evaluators = new Registry<Evaluator>();

const BUFFER_OVERRIDE_FLAG = Symbol.for('nocobase.evaluators.bufferOverrides');

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
  const descriptors = Object.getOwnPropertyDescriptors(bufferPrototype);
  for (const key of Reflect.ownKeys(descriptors)) {
    const descriptor = descriptors[key as string];
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
        enumerable: descriptor.enumerable,
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

// mysql2 mutates Buffer instances when mocking packets; run the shim before the SES lockdown happens.
enableBufferPrototypeOverrides();

const formulajs = createFormulaEvaluator({
  lockdownOptions: {
    consoleTaming: 'unsafe',
    errorTaming: 'unsafe',
    overrideTaming: 'moderate',
    stackFiltering: 'verbose',
  },
  blockedIdentifiers: ['process', 'require', 'module', 'exports', '__filename', '__dirname', 'Buffer'],
});

evaluators.register('math.js', mathjs);
evaluators.register('formula.js', formulajs);
evaluators.register('string', string);

export default evaluators;
