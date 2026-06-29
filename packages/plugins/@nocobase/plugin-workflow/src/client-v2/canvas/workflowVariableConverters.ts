/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { MetaTreeNode, VariableHybridInputConverters } from '@nocobase/flow-engine';

export const WORKFLOW_VARIABLE_REGEXP = /\{\{\s*([^{}]+?)\s*\}\}/g;

export function formatWorkflowPathToValue(item?: MetaTreeNode) {
  const path = item?.paths ?? [];
  return path.length ? `{{${path.join('.')}}}` : '';
}

export function parseWorkflowValueToPath(value?: string) {
  if (typeof value !== 'string') {
    return undefined;
  }
  const match = value.trim().match(/^\{\{\s*(.+?)\s*\}\}$/);
  if (!match) {
    return undefined;
  }
  return match[1].split('.');
}

export const workflowVariableConverters: VariableHybridInputConverters = {
  formatPathToValue: formatWorkflowPathToValue,
  parseValueToPath: parseWorkflowValueToPath,
  variableRegExp: WORKFLOW_VARIABLE_REGEXP,
};
