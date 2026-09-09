/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type {
  CtxDateExpressionConfig,
  CtxDatePreset,
  MetaTreeNode,
  VariableHybridInputConverters,
} from '@nocobase/flow-engine';

const WORKFLOW_DATE_RANGE_PRESETS = new Set<CtxDatePreset>([
  'today',
  'yesterday',
  'tomorrow',
  'thisWeek',
  'lastWeek',
  'nextWeek',
  'thisMonth',
  'lastMonth',
  'nextMonth',
  'thisQuarter',
  'lastQuarter',
  'nextQuarter',
  'thisYear',
  'lastYear',
  'nextYear',
]);

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
  const path = match[1].split('.');
  return path[0] === 'ctx' && path[1]?.startsWith('$') ? path.slice(1) : path;
}

export function parseWorkflowDateVariableValue(value: unknown): CtxDateExpressionConfig | undefined {
  if (typeof value !== 'string') return undefined;
  const path = parseWorkflowValueToPath(value);
  if (path?.length === 2 && path[0] === '$system' && path[1] === 'now') {
    return { kind: 'preset', preset: 'now' };
  }
  if (path?.length !== 3 || path[0] !== '$system' || path[1] !== 'dateRange') return undefined;
  const preset = path[2] as CtxDatePreset;
  return WORKFLOW_DATE_RANGE_PRESETS.has(preset) ? { kind: 'preset', preset } : undefined;
}

export function serializeWorkflowDateVariableValue(config: CtxDateExpressionConfig): unknown {
  if (config.kind === 'exact') return config.value;
  if (config.kind === 'preset') {
    if (config.preset === 'now') return '{{$system.now}}';
    return WORKFLOW_DATE_RANGE_PRESETS.has(config.preset) ? `{{$system.dateRange.${config.preset}}}` : '';
  }

  if (config.amount !== 1) return '';
  const preset =
    config.unit === 'day'
      ? config.direction === 'past'
        ? 'yesterday'
        : 'tomorrow'
      : (`${config.direction === 'past' ? 'last' : 'next'}${
          config.unit[0].toUpperCase() + config.unit.slice(1)
        }` as CtxDatePreset);
  return WORKFLOW_DATE_RANGE_PRESETS.has(preset) ? `{{$system.dateRange.${preset}}}` : '';
}

export const workflowVariableConverters: VariableHybridInputConverters = {
  formatPathToValue: formatWorkflowPathToValue,
  parseValueToPath: parseWorkflowValueToPath,
  variableRegExp: WORKFLOW_VARIABLE_REGEXP,
};
