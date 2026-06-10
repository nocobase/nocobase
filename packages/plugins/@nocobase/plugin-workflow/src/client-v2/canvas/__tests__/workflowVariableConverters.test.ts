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

// Re-declare the converters here as a pure-logic mirror (the component wires the same functions into
// VariableHybridInput). Keeping them inline avoids importing the .tsx component (and React) into a pure logic test.
const formatPathToValue = (item: { paths?: string[] }) => {
  const path = item?.paths ?? [];
  return path.length ? `{{${path.join('.')}}}` : '';
};
const parseValueToPath = (value?: string) => {
  if (typeof value !== 'string') return undefined;
  const match = value.trim().match(/^\{\{\s*(.+?)\s*\}\}$/);
  return match ? match[1].split('.') : undefined;
};

describe('workflow variable converters', () => {
  it('formats an adapter-built leaf path to the $jobsMapByNodeKey template', () => {
    const node = adaptVariableOptionToMetaTree({ value: 'title', children: null }, ['$jobsMapByNodeKey', 'node1']);
    expect(node.paths).toEqual(['$jobsMapByNodeKey', 'node1', 'title']);
    expect(formatPathToValue(node)).toBe('{{$jobsMapByNodeKey.node1.title}}');
  });

  it('round-trips: format → parse === the leaf paths', () => {
    const node = adaptVariableOptionToMetaTree({ value: 'field' }, ['$jobsMapByNodeKey', 'nodeX']);
    const value = formatPathToValue(node);
    expect(parseValueToPath(value)).toEqual(node.paths);
  });

  it('parse tolerates inner whitespace and returns undefined for non-variable strings', () => {
    expect(parseValueToPath('{{ $jobsMapByNodeKey.n.f }}')).toEqual(['$jobsMapByNodeKey', 'n', 'f']);
    expect(parseValueToPath('plain text')).toBeUndefined();
  });
});
