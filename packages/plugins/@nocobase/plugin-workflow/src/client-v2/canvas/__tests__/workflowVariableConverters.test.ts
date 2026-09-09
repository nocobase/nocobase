/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * The WorkflowVariableInput converters bridge a MetaTreeNode's `paths` to the
 * workflow server-template form `{{$jobsMapByNodeKey.<nodeKey>.<field>}}`. This
 * pins the format/parse round-trip against the adapter-built paths, the
 * value-shape the server consumes.
 */

import { describe, expect, it } from 'vitest';
import { adaptVariableOptionToMetaTree } from '../adaptVariableOptionToMetaTree';
import {
  formatWorkflowPathToValue,
  parseWorkflowDateVariableValue,
  parseWorkflowValueToPath,
  serializeWorkflowDateVariableValue,
} from '../workflowVariableConverters';

describe('workflow variable converters', () => {
  it('formats an adapter-built leaf path to the $jobsMapByNodeKey template', () => {
    const node = adaptVariableOptionToMetaTree({ value: 'title', children: null }, ['$jobsMapByNodeKey', 'node1']);
    expect(node.paths).toEqual(['$jobsMapByNodeKey', 'node1', 'title']);
    expect(formatWorkflowPathToValue(node)).toBe('{{$jobsMapByNodeKey.node1.title}}');
  });

  it('round-trips: format → parse === the leaf paths', () => {
    const node = adaptVariableOptionToMetaTree({ value: 'field' }, ['$jobsMapByNodeKey', 'nodeX']);
    const value = formatWorkflowPathToValue(node);
    expect(parseWorkflowValueToPath(value)).toEqual(node.paths);
  });

  it('parse tolerates inner whitespace and returns undefined for non-variable strings', () => {
    expect(parseWorkflowValueToPath('{{ $jobsMapByNodeKey.n.f }}')).toEqual(['$jobsMapByNodeKey', 'n', 'f']);
    expect(parseWorkflowValueToPath('plain text')).toBeUndefined();
  });

  it('parses the FlowEngine ctx form without adding ctx to the workflow path', () => {
    expect(parseWorkflowValueToPath('{{ ctx.$context.data.id }}')).toEqual(['$context', 'data', 'id']);
  });

  it('round-trips Date presets through workflow system variables', () => {
    expect(serializeWorkflowDateVariableValue({ kind: 'preset', preset: 'today' })).toBe('{{$system.dateRange.today}}');
    expect(parseWorkflowDateVariableValue('{{$system.dateRange.today}}')).toEqual({
      kind: 'preset',
      preset: 'today',
    });
  });

  it('uses the dedicated workflow now variable', () => {
    expect(serializeWorkflowDateVariableValue({ kind: 'preset', preset: 'now' })).toBe('{{$system.now}}');
    expect(parseWorkflowDateVariableValue('{{$system.now}}')).toEqual({ kind: 'preset', preset: 'now' });
  });

  it('maps one-day relative values to the supported workflow presets', () => {
    expect(serializeWorkflowDateVariableValue({ kind: 'relative', direction: 'past', amount: 1, unit: 'day' })).toBe(
      '{{$system.dateRange.yesterday}}',
    );
    expect(serializeWorkflowDateVariableValue({ kind: 'relative', direction: 'next', amount: 1, unit: 'day' })).toBe(
      '{{$system.dateRange.tomorrow}}',
    );
  });
});
