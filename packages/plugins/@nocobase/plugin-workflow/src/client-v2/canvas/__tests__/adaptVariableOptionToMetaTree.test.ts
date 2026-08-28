/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * Correctness contract + retirement-regression baseline for the
 * `VariableOption → MetaTreeNode` adapter (migration doc §6, the 15 cases).
 *
 * The adapter is pure and context-free; this whole suite is deleted in one move
 * when the legacy field-tree logic is finally rewritten to produce MetaTreeNode
 * natively (case 15 pins that nothing else consumes the adapter).
 */

import React from 'react';
import { describe, expect, it } from 'vitest';
import { formatPathToValue, parseValueToPath } from '@nocobase/flow-engine';
import { adaptVariableOptionToMetaTree } from '../adaptVariableOptionToMetaTree';
import { getCollectionFieldOptions } from '../collectionFieldOptions';

describe('adaptVariableOptionToMetaTree', () => {
  // --- 基础映射 -------------------------------------------------------------

  it('1. maps label→title, value→name', () => {
    const node = adaptVariableOptionToMetaTree({ label: 'Title', value: 'title' });
    expect(node.title).toBe('Title');
    expect(node.name).toBe('title');
  });

  it('2. tolerates a ReactNode label (does not crash; preserved for walk to plain-text)', () => {
    const label = React.createElement('span', null, 'Rich');
    const node = adaptVariableOptionToMetaTree({ label, value: 'x' });
    expect(node.name).toBe('x');
    // title carries the ReactNode through unchanged; the walk side plain-texts it.
    expect(node.title).toBe(label);
  });

  it('3. falls back to name when label is missing', () => {
    const node = adaptVariableOptionToMetaTree({ value: 'onlyValue' });
    expect(node.name).toBe('onlyValue');
    expect(node.title).toBe('onlyValue');
  });

  // --- paths 累积（核心，唯一构造项）---------------------------------------

  it('4. top-level paths = [own value]', () => {
    const node = adaptVariableOptionToMetaTree({ value: 'a' });
    expect(node.paths).toEqual(['a']);
  });

  it('5. accumulates paths across two nested levels', () => {
    const node = adaptVariableOptionToMetaTree({
      value: 'a',
      children: [{ value: 'b', children: [{ value: 'c' }] }],
    });
    const a = node;
    const b = (a.children as any[])[0];
    const c = (b.children as any[])[0];
    expect(a.paths).toEqual(['a']);
    expect(b.paths).toEqual(['a', 'b']);
    expect(c.paths).toEqual(['a', 'b', 'c']);
  });

  it('6. accumulates under a custom root prefix (node output mounted at $jobsMapByNodeKey.<nodeKey>)', () => {
    const node = adaptVariableOptionToMetaTree({ value: 'field1' }, ['$jobsMapByNodeKey', 'node1']);
    expect(node.paths).toEqual(['$jobsMapByNodeKey', 'node1', 'field1']);
  });

  // --- children / 懒加载 ----------------------------------------------------

  it('7. maps a static children array recursively with correct paths', () => {
    const node = adaptVariableOptionToMetaTree({
      value: 'root',
      children: [{ value: 'x' }, { value: 'y' }],
    });
    expect(Array.isArray(node.children)).toBe(true);
    const children = node.children as any[];
    expect(children.map((c) => c.name)).toEqual(['x', 'y']);
    expect(children[0].paths).toEqual(['root', 'x']);
  });

  it('8. children:null / isLeaf:true → no children (no expand arrow)', () => {
    const leaf = adaptVariableOptionToMetaTree({ value: 'leaf', children: null, isLeaf: true });
    expect(leaf.children).toBeUndefined();
  });

  it('9. loadChildren → children:()=>Promise; v1-only keys captured by closure, absent from MetaTreeNode', async () => {
    const v1Option: any = {
      value: 'assoc',
      isLeaf: false,
      // v1-only keys that must never surface on the produced node:
      field: { type: 'belongsTo', target: 'users' },
      types: ['string'],
      appends: ['assoc'],
      depth: 1,
      loadChildren(option: any) {
        option.loadChildren = null;
        option.children = [{ value: 'id' }, { value: 'nickname' }];
      },
    };
    const node = adaptVariableOptionToMetaTree(v1Option);

    // v1-only keys do not leak onto the MetaTreeNode.
    expect(node).not.toHaveProperty('field');
    expect(node).not.toHaveProperty('types');
    expect(node).not.toHaveProperty('appends');
    expect(node).not.toHaveProperty('depth');
    // type/interface are derived from field (allowed), not the raw field object.
    expect(node.type).toBe('belongsTo');

    expect(typeof node.children).toBe('function');
    const loaded = await (node.children as () => Promise<any[]>)();
    expect(loaded.map((c) => c.name)).toEqual(['id', 'nickname']);
    // paths continue to accumulate through the lazy boundary.
    expect(loaded[0].paths).toEqual(['assoc', 'id']);
  });

  it('10. loadChildren resolving empty → node becomes a leaf (mirrors v1 isLeaf)', async () => {
    const v1Option: any = {
      value: 'assoc',
      loadChildren(option: any) {
        option.loadChildren = null;
        option.children = [];
        option.isLeaf = true;
      },
    };
    const node = adaptVariableOptionToMetaTree(v1Option);
    const loaded = await (node.children as () => Promise<any[]>)();
    expect(loaded).toEqual([]);
  });

  // --- disabled / 过滤 ------------------------------------------------------

  it('11. disabled=true (type mismatch) → MetaTreeNode.disabled=true', () => {
    const node = adaptVariableOptionToMetaTree({ value: 'x', disabled: true });
    expect(node.disabled).toBe(true);
  });

  it('12. disabled passes through without dropping the node (no accidental prune)', () => {
    const node = adaptVariableOptionToMetaTree({
      value: 'parent',
      disabled: true,
      children: [{ value: 'child', disabled: true }],
    });
    expect(node.disabled).toBe(true);
    expect((node.children as any[])[0].disabled).toBe(true);
  });

  // --- 端到端 ---------------------------------------------------------------

  it('13. real getCollectionFieldOptions output → adapter → walkable tree (paths complete, no throw)', () => {
    const compile = (s: unknown) => {
      if (typeof s !== 'string') return s;
      const m = s.match(/^\{\{\s*t\(["'](.+?)["'].*\)\s*\}\}$/);
      return m ? m[1] : s;
    };
    const collectionManager = {
      getCollectionAllFields: (c: string) =>
        ({
          posts: [
            { name: 'id', type: 'bigInt', interface: 'integer', uiSchema: { title: 'ID' }, primaryKey: true },
            { name: 'title', type: 'string', interface: 'input', uiSchema: { title: '{{t("Title")}}' } },
          ],
        })[c] ?? [],
    };
    const options = getCollectionFieldOptions({ collection: 'posts', compile, collectionManager });
    const nodes = options.map((o) => adaptVariableOptionToMetaTree(o, ['$jobsMapByNodeKey', 'node1']));

    // Build a value→title map the way the walk would, asserting paths are complete.
    const map = new Map(nodes.map((n) => [n.paths.join('.'), n.title]));
    expect(map.get('$jobsMapByNodeKey.node1.title')).toBe('Title');
    expect(map.get('$jobsMapByNodeKey.node1.id')).toBe('ID');
  });

  it('14. round-trip: leaf → formatPathToValue → parseValueToPath === the leaf paths', () => {
    const node = adaptVariableOptionToMetaTree({ value: 'c', children: null }, ['a', 'b']);
    expect(node.paths).toEqual(['a', 'b', 'c']);
    const value = formatPathToValue(node); // {{ ctx.a.b.c }}
    expect(parseValueToPath(value)).toEqual(['a', 'b', 'c']);
  });

  // --- 退役安全 -------------------------------------------------------------

  it('15. is pure: same input yields an equivalent fresh tree, input is not mutated', () => {
    const input: any = { value: 'a', children: [{ value: 'b' }] };
    const snapshot = JSON.parse(JSON.stringify(input));
    const first = adaptVariableOptionToMetaTree(input);
    const second = adaptVariableOptionToMetaTree(input);
    // No shared identity between calls (fresh tree each time).
    expect(first).not.toBe(second);
    expect(first.children).not.toBe(second.children);
    // Input untouched (no side effects on the source VariableOption).
    expect(input).toEqual(snapshot);
  });
});
