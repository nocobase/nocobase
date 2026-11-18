/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { MetaTreeNode } from '@nocobase/flow-engine';
import { describe, expect, it, vi } from 'vitest';
import { adaptScopeVariables } from '../adaptScopeVariables';

const item: MetaTreeNode = { name: 'item', title: 'Loop target', type: '', paths: ['item'] };
const id: MetaTreeNode = { name: 'id', title: 'ID', type: 'number', paths: ['item', 'id'] };

describe('adaptScopeVariables', () => {
  it('preserves existing legacy options and their loaders', () => {
    const legacy = { value: 'item', label: 'Legacy item', loadChildren: vi.fn() };
    expect(adaptScopeVariables([legacy])[0]).toBe(legacy);
    expect(legacy.loadChildren).not.toHaveBeenCalled();
  });

  it('converts static children without changing the source metadata or path segments', () => {
    const source = { ...item, children: [id] };
    const [option] = adaptScopeVariables([source]);
    expect(option).toMatchObject({ value: 'item', label: 'Loop target', isLeaf: false });
    expect(option.children).toMatchObject([{ value: 'id', label: 'ID', type: 'number', isLeaf: true }]);
    expect(source.children).toEqual([id]);
    expect(source.children[0]).toBe(id);
    expect(source).not.toHaveProperty('value');
  });

  it.each([{ children: [] }, { children: [id] }])(
    'loads children lazily and updates leaf state ($children)',
    async ({ children }) => {
      const loader = vi.fn().mockResolvedValue(children);
      const [option] = adaptScopeVariables([{ ...item, children: loader }]);
      expect(loader).not.toHaveBeenCalled();
      expect(option.children).toBeUndefined();
      expect(option.isLeaf).toBe(false);
      await option.loadChildren(option);
      expect(option.children?.map((child) => child.value)).toEqual(children.map((child) => child.name));
      expect(option.isLeaf).toBe(children.length === 0);
      expect(option.loadChildren).toBeUndefined();
    },
  );

  it('leaves failed loads retryable', async () => {
    const loader = vi.fn().mockRejectedValueOnce(new Error('Unavailable')).mockResolvedValueOnce([id]);
    const [option] = adaptScopeVariables([{ ...item, children: loader }]);
    await expect(option.loadChildren(option)).rejects.toThrow('Unavailable');
    expect(option.children).toBeUndefined();
    expect(option.isLeaf).toBe(false);
    await option.loadChildren(option);
    expect(option.children?.[0].value).toBe('id');
  });

  it('uses custom field names for static and lazy descendants', async () => {
    const source = { ...item, children: [{ ...id, children: async () => [{ ...id, name: 'nested' }] }] };
    const [option] = adaptScopeVariables([source], { label: 'text', value: 'name', children: 'items' });
    expect(option).toMatchObject({ name: 'item', text: 'Loop target', items: [{ name: 'id', text: 'ID' }] });
    expect(option.children).toBeUndefined();
    await option.items[0].loadChildren(option.items[0]);
    expect(option.items[0].items[0]).toMatchObject({ name: 'nested', text: 'ID', isLeaf: true });
    expect(option.items[0].children).toBeUndefined();
  });

  it('evaluates metadata visibility and disabled callbacks', () => {
    const [option] = adaptScopeVariables([
      { ...item, disabled: () => false, children: [{ ...id, hidden: () => true }] },
      { ...id, hidden: true },
    ]);
    expect(option.disabled).toBe(false);
    expect(option.children).toEqual([]);
    expect(option.isLeaf).toBe(true);
    expect(adaptScopeVariables([{ ...id, disabled: () => true }])[0].disabled).toBe(true);
  });
});
