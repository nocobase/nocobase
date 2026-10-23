/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { isRunJSValue, isVariableExpression } from '@nocobase/flow-engine';

type ArrayValueCollectionField =
  | {
      interface?: string;
      uiSchema?: {
        type?: string;
      } | null;
    }
  | null
  | undefined;

/**
 * Fields whose stored value is an array. Besides `multipleSelect`/`checkboxGroup`,
 * some legacy fields declare `uiSchema.type === 'array'` explicitly.
 */
export function isArrayValueField(collectionField: ArrayValueCollectionField): boolean {
  if (!collectionField) {
    return false;
  }
  if (collectionField.interface === 'multipleSelect' || collectionField.interface === 'checkboxGroup') {
    return true;
  }
  return collectionField.uiSchema?.type === 'array';
}

/**
 * Normalize a constant assignment value for array-valued fields.
 *
 * Historical configurations may store a scalar (before the multi-select control
 * was rendered correctly), so wrap it into an array instead of submitting a
 * string to the server. Variable expressions, RunJS values, Null and empty
 * values are kept as-is so the assignment mode is not changed.
 */
export function normalizeAssignFormValue(value: unknown, arrayValueField: boolean): unknown {
  if (!arrayValueField) {
    return value;
  }
  if (isVariableExpression(value) || isRunJSValue(value)) {
    return value;
  }
  if (value === '') {
    return [];
  }
  if (Array.isArray(value)) {
    return value;
  }
  if (value === null || typeof value === 'undefined') {
    return value;
  }
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return [value];
  }
  return value;
}
