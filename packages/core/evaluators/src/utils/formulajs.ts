/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import * as functions from '@formulajs/formulajs';
import { round } from 'mathjs';
import type { LockdownOptions } from 'ses';
import 'ses';

import { evaluate, Scope } from '.';

const FUNCTION_NAMES = Object.keys(functions).filter((key) => key !== 'default');
const SES_LOCK_FLAG = Symbol.for('nocobase.evaluators.sesLockdown');

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

export interface FormulaEvaluatorOptions {
  lockdown?: boolean;
  lockdownOptions?: LockdownOptions;
  blockedIdentifiers?: string[];
}

function isAlreadyLockedError(error: unknown) {
  if (!error || typeof error !== 'object') {
    return false;
  }
  const message = (error as Error).message || '';
  return message.includes('(SES_ALREADY_LOCKED_DOWN)');
}

function ensureLockdown(options?: LockdownOptions) {
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

function buildEndowments(scope: Scope, blockedIdentifiers: string[]) {
  const endowments: Record<string, any> = Object.create(null);
  for (const key of FUNCTION_NAMES) {
    endowments[key] = functions[key];
  }
  if (scope && typeof scope === 'object') {
    for (const [key, value] of Object.entries(scope)) {
      endowments[key] = value;
    }
  }
  for (const key of blockedIdentifiers) {
    endowments[key] = undefined;
  }
  return endowments;
}

function runInSandbox(expression: string, scope: Scope, options: InternalEvaluatorOptions) {
  if (options.lockdown) {
    ensureLockdown(options.lockdownOptions);
  }
  const compartment = new Compartment(buildEndowments(scope, options.blockedIdentifiers));
  return compartment.evaluate(expression);
}

interface InternalEvaluatorOptions {
  lockdown: boolean;
  lockdownOptions?: LockdownOptions;
  blockedIdentifiers: string[];
}

export function createFormulaEvaluator(options: FormulaEvaluatorOptions = {}) {
  const mergedOptions: InternalEvaluatorOptions = {
    lockdown: options.lockdown !== false,
    lockdownOptions: options.lockdownOptions,
    blockedIdentifiers: Array.from(new Set([...(options.blockedIdentifiers || []), ...BASE_BLOCKED_IDENTIFIERS])),
  };

  return evaluate.bind(function (expression: string, scope: Scope = {}) {
    const result = runInSandbox(expression, scope, mergedOptions);
    if (typeof result === 'number') {
      if (Number.isNaN(result) || !Number.isFinite(result)) {
        return null;
      }
      return round(result, 9);
    }
    return result;
  }, {});
}

export default createFormulaEvaluator();
