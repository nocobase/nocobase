/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import type { MetaTreeNode } from '@nocobase/flow-engine';
import { enhanceMetaTreeWithFilterableChildren, mergeExtraMetaTreeWithBase } from '../LinkageFilterItem';

describe('LinkageFilterItem meta tree merge', () => {
  it('merges extra item into base item and keeps one root item node', () => {
    const base: MetaTreeNode[] = [
      { name: 'formValues', title: 'Current form', type: 'object', paths: ['formValues'] },
      {
        name: 'item',
        title: 'Current item（o2m）',
        type: 'object',
        paths: ['item'],
        children: [
          {
            name: 'value',
            title: 'Attributes',
            type: 'object',
            paths: ['item', 'value'],
          },
        ],
      },
      { name: 'user', title: 'Current user', type: 'object', paths: ['user'] },
    ];

    const extra: MetaTreeNode[] = [
      {
        name: 'item',
        title: 'Current item（Created By）',
        type: 'object',
        paths: ['item'],
        children: [
          {
            name: 'value',
            title: 'Attributes',
            type: 'object',
            paths: ['item', 'value'],
          },
        ],
      },
    ];

    const merged = mergeExtraMetaTreeWithBase(base, extra);
    expect(merged.map((node) => node.name)).toEqual(['formValues', 'item', 'user']);
    expect(merged.filter((node) => node.name === 'item')).toHaveLength(1);

    const itemNode = merged.find((node) => node.name === 'item');
    expect(itemNode).toBeTruthy();
    const parentItemNode = (itemNode?.children as MetaTreeNode[] | undefined)?.find(
      (node) => node.name === 'parentItem',
    );
    expect(parentItemNode).toBeTruthy();
  });

  it('keeps extra non-item nodes before merged base tree', () => {
    const base: MetaTreeNode[] = [{ name: 'record', title: 'Current record', type: 'object', paths: ['record'] }];
    const extra: MetaTreeNode[] = [
      { name: 'foo', title: 'Foo', type: 'string', paths: ['foo'] },
      { name: 'item', title: 'Current item', type: 'object', paths: ['item'] },
    ];

    const merged = mergeExtraMetaTreeWithBase(base, extra);
    expect(merged.map((node) => node.name)).toEqual(['foo', 'record', 'item']);
  });

  it('falls back to extra + base when extra has no item node', () => {
    const base: MetaTreeNode[] = [{ name: 'record', title: 'Current record', type: 'object', paths: ['record'] }];
    const extra: MetaTreeNode[] = [{ name: 'foo', title: 'Foo', type: 'string', paths: ['foo'] }];

    const merged = mergeExtraMetaTreeWithBase(base, extra);
    expect(merged.map((node) => node.name)).toEqual(['foo', 'record']);
  });

  it('injects filterable children for attachment-like field nodes', async () => {
    const base: MetaTreeNode[] = [
      {
        name: 'formValues',
        title: 'Current form',
        type: 'object',
        paths: ['formValues'],
        children: [
          {
            name: 'attachment',
            title: 'Attachment',
            type: 'array',
            interface: 'attachment',
            paths: ['formValues', 'attachment'],
          },
        ],
      },
    ];

    const getFieldInterface = vi.fn((name: string) => {
      if (name !== 'attachment') return undefined;
      return {
        filterable: {
          children: [
            {
              name: 'id',
              title: 'Exists',
              schema: { type: 'string', 'x-component': 'Input' },
              operators: [{ value: '$exists', label: 'exists', noValue: true }],
            },
            {
              name: 'filename',
              title: 'Filename',
              schema: { type: 'string', 'x-component': 'Input' },
              operators: [{ value: '$includes', label: 'contains' }],
            },
          ],
        },
      };
    });

    const enhanced = await enhanceMetaTreeWithFilterableChildren(base, getFieldInterface);
    const attachmentNode = ((enhanced[0].children as MetaTreeNode[]) || []).find((node) => node.name === 'attachment');
    expect(attachmentNode).toBeTruthy();
    expect((attachmentNode?.children as MetaTreeNode[]).map((node) => node.name)).toEqual(['id', 'filename']);
    expect((attachmentNode?.children as MetaTreeNode[])[0].uiSchema?.['x-filter-operators']).toBeTruthy();
  });

  it('keeps lazy children and enhances loaded nodes recursively', async () => {
    const base: MetaTreeNode[] = [
      {
        name: 'formValues',
        title: 'Current form',
        type: 'object',
        paths: ['formValues'],
        children: async () => [
          {
            name: 'attachment',
            title: 'Attachment',
            type: 'array',
            interface: 'attachment',
            paths: ['formValues', 'attachment'],
          },
        ],
      },
    ];

    const getFieldInterface = vi.fn((name: string) => {
      if (name !== 'attachment') return undefined;
      return {
        filterable: {
          children: [{ name: 'id', title: 'Exists', schema: { type: 'string', 'x-component': 'Input' } }],
        },
      };
    });

    const enhanced = await enhanceMetaTreeWithFilterableChildren(base, getFieldInterface);
    expect(typeof enhanced[0].children).toBe('function');

    const loadedChildren = await (enhanced[0].children as () => Promise<MetaTreeNode[]>)();
    const attachmentNode = loadedChildren.find((node) => node.name === 'attachment');
    expect(attachmentNode).toBeTruthy();
    expect((attachmentNode?.children as MetaTreeNode[]).map((node) => node.name)).toEqual(['id']);
  });
});
