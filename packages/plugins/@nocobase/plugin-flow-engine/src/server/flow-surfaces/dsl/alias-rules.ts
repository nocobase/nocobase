/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';
import { throwBadRequest } from '../errors';

type FlowSurfaceExecuteDslUnsupportedFieldRule = {
  field: string;
  replacement?: string;
  message?: string | ((context: string) => string);
};

function assertNoUnsupportedFields(
  input: Record<string, any>,
  context: string,
  rules: FlowSurfaceExecuteDslUnsupportedFieldRule[],
) {
  for (const rule of rules) {
    if (_.isUndefined(input?.[rule.field])) {
      continue;
    }
    const message =
      typeof rule.message === 'function'
        ? rule.message(context)
        : rule.message || `${context}.${rule.field} is unsupported; use ${rule.replacement}`;
    throwBadRequest(message);
  }
}

const EXECUTE_DSL_BLOCK_RULES: FlowSurfaceExecuteDslUnsupportedFieldRule[] = [
  { field: 'events', message: (context) => `${context}.events is not supported by executeDsl; use low-level APIs` },
];

const EXECUTE_DSL_FIELD_RULES: FlowSurfaceExecuteDslUnsupportedFieldRule[] = [
  { field: 'events', message: (context) => `${context}.events is not supported by executeDsl; use low-level APIs` },
  { field: 'fieldPath', replacement: 'field' },
  { field: 'openView', replacement: 'popup' },
  { field: 'targetBlock', replacement: 'target' },
];

const EXECUTE_DSL_ACTION_RULES: FlowSurfaceExecuteDslUnsupportedFieldRule[] = [
  { field: 'events', message: (context) => `${context}.events is not supported by executeDsl; use low-level APIs` },
];

const EXECUTE_DSL_BLOCK_ROOT_RESOURCE_ALIAS_RULES: FlowSurfaceExecuteDslUnsupportedFieldRule[] = [
  { field: 'resourceBinding', replacement: 'binding' },
  { field: 'collectionName', replacement: 'collection' },
  { field: 'association', replacement: 'associationPathName' },
];

const EXECUTE_DSL_BLOCK_RESOURCE_OBJECT_ALIAS_RULES: FlowSurfaceExecuteDslUnsupportedFieldRule[] = [
  { field: 'resourceBinding', replacement: 'binding' },
  { field: 'collection', replacement: 'collectionName' },
  { field: 'association', replacement: 'associationPathName' },
];

export function assertNoExecuteDslBlockRestrictions(input: Record<string, any>, context: string) {
  assertNoUnsupportedFields(input, context, EXECUTE_DSL_BLOCK_RULES);
}

export function assertNoExecuteDslFieldRestrictions(input: Record<string, any>, context: string) {
  assertNoUnsupportedFields(input, context, EXECUTE_DSL_FIELD_RULES);
}

export function assertNoExecuteDslActionRestrictions(input: Record<string, any>, context: string) {
  assertNoUnsupportedFields(input, context, EXECUTE_DSL_ACTION_RULES);
}

export function assertNoExecuteDslBlockRootResourceAliases(input: Record<string, any>, context: string) {
  assertNoUnsupportedFields(input, context, EXECUTE_DSL_BLOCK_ROOT_RESOURCE_ALIAS_RULES);
}

export function assertNoExecuteDslBlockResourceObjectAliases(input: Record<string, any>, context: string) {
  assertNoUnsupportedFields(input, context, EXECUTE_DSL_BLOCK_RESOURCE_OBJECT_ALIAS_RULES);
}
