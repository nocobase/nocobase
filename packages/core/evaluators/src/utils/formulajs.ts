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
import 'ses';

import { evaluate, Scope } from '.';

const FUNCTION_NAMES = Object.keys(functions).filter((key) => key !== 'default');

export interface FormulaEvaluatorOptions {
  blockedIdentifiers?: string[];
}

function buildEndowments(scope: Scope, blockedIdentifiers: string[] = []) {
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
  const compartment = new Compartment(buildEndowments(scope, options.blockedIdentifiers));
  return compartment.evaluate(expression);
}

interface InternalEvaluatorOptions {
  blockedIdentifiers: string[];
}

export function createFormulaEvaluator(options: FormulaEvaluatorOptions = {}) {
  const mergedOptions: InternalEvaluatorOptions = {
    blockedIdentifiers: options.blockedIdentifiers,
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
