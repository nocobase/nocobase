/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { App, ConfigProvider } from 'antd';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, userEvent, waitFor } from '@nocobase/test/client';
import type { MetaTreeNode } from '@nocobase/flow-engine';
import { FieldAssignRulesEditor, type FieldAssignRuleItem } from '../FieldAssignRulesEditor';
import { mergeItemMetaTreeForAssignValue } from '../FieldAssignValueInput';

vi.mock('../FieldAssignValueInput', async () => {
  const actual = await vi.importActual<typeof import('../FieldAssignValueInput')>('../FieldAssignValueInput');
  return {
    ...actual,
    FieldAssignValueInput: (props: any) => (
      <div data-testid="mock-value-input" data-extra={Array.isArray(props?.extraMetaTree) ? 'yes' : 'no'} />
    ),
  };
});

vi.mock('../ConditionBuilder', async () => {
  const actual = await vi.importActual<typeof import('../ConditionBuilder')>('../ConditionBuilder');
  return {
    ...actual,
    ConditionBuilder: (props: any) => (
      <div data-testid="mock-condition-builder" data-extra={props?.extraMetaTree ? 'yes' : 'no'} />
    ),
  };
});

describe('FieldAssignRulesEditor', () => {
  const t = (key: string) => key;
  const wrap = (ui: React.ReactElement) => (
    <ConfigProvider>
      <App>{ui}</App>
    </ConfigProvider>
  );

  it('defaults to expand the last enabled item', () => {
    const value: FieldAssignRuleItem[] = [
      { key: '1', enable: false, targetPath: 'a', mode: 'assign' },
      { key: '2', enable: true, targetPath: 'b', mode: 'assign' },
      { key: '3', enable: true, targetPath: 'c', mode: 'assign' },
    ];

    const { container } = render(
      wrap(<FieldAssignRulesEditor t={t} fieldOptions={[]} value={value} showCondition={false} />),
    );

    const active = container.querySelector('.ant-collapse-item-active');
    expect(active).not.toBeNull();
    expect(active?.textContent).toContain('c');
  });

  it('falls back to expand the first item when all items are disabled', () => {
    const value: FieldAssignRuleItem[] = [
      { key: '1', enable: false, targetPath: 'a', mode: 'assign' },
      { key: '2', enable: false, targetPath: 'b', mode: 'assign' },
    ];

    const { container } = render(
      wrap(<FieldAssignRulesEditor t={t} fieldOptions={[]} value={value} showCondition={false} />),
    );

    const active = container.querySelector('.ant-collapse-item-active');
    expect(active).not.toBeNull();
    expect(active?.textContent).toContain('a');
  });

  it('uses extra item tree only in value editor', () => {
    const userCollection = {
      getField: () => null,
      getFields: () => [
        {
          name: 'nickname',
          title: 'Nickname',
          type: 'string',
          interface: 'input',
          isAssociationField: () => false,
        },
      ],
    };
    const m2oField: any = {
      name: 'Created_By',
      title: 'Created_By',
      type: 'belongsTo',
      interface: 'm2o',
      isAssociationField: () => true,
      targetCollection: userCollection,
    };
    const m2mCollection: any = {
      getField: (name: string) => (name === 'Created_By' ? m2oField : null),
      getFields: () => [m2oField],
    };
    const m2mField: any = {
      name: 'm2m',
      title: 'm2m',
      type: 'belongsToMany',
      interface: 'm2m',
      isAssociationField: () => true,
      targetCollection: m2mCollection,
    };
    const rootCollection = {
      getField: (name: string) => (name === 'm2m' ? m2mField : null),
      getFields: () => [m2mField],
    };

    const value: FieldAssignRuleItem[] = [
      {
        key: '1',
        enable: true,
        targetPath: 'm2m.Created_By',
        mode: 'assign',
        condition: { logic: '$and', items: [] },
      },
    ];

    const { getByTestId } = render(
      wrap(
        <FieldAssignRulesEditor t={t} fieldOptions={[]} rootCollection={rootCollection} value={value} showCondition />,
      ),
    );

    expect(getByTestId('mock-value-input').getAttribute('data-extra')).toBe('yes');
    expect(getByTestId('mock-condition-builder').getAttribute('data-extra')).toBe('yes');
  });

  it('renders empty state when no items', () => {
    const { container } = render(
      wrap(<FieldAssignRulesEditor t={t} fieldOptions={[]} value={[]} showCondition={false} />),
    );

    expect(container.querySelector('.ant-collapse')).toBeNull();
    expect(container.textContent).toContain('No data');
  });

  it('renders assignment mode as radios and supports mode switching', async () => {
    const onChange = vi.fn();
    const value: FieldAssignRuleItem[] = [
      {
        key: '1',
        enable: true,
        targetPath: 'title',
        mode: 'assign',
      },
    ];

    render(
      wrap(
        <FieldAssignRulesEditor
          t={t}
          fieldOptions={[]}
          value={value}
          onChange={onChange}
          showCondition={false}
          showEnable={false}
        />,
      ),
    );

    expect(screen.getByLabelText('Default value')).toBeInTheDocument();
    expect(screen.getByLabelText('Fixed value')).toBeInTheDocument();
    expect(screen.getByLabelText('Fixed value')).toBeChecked();
    await userEvent.click(screen.getByLabelText('Default value'));
    await waitFor(() => {
      expect(onChange).toHaveBeenCalled();
    });

    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1]?.[0] as FieldAssignRuleItem[];
    expect(lastCall?.[0]?.mode).toBe('default');
  });

  it('shows assignment mode tooltips for each option', async () => {
    const value: FieldAssignRuleItem[] = [
      {
        key: '1',
        enable: true,
        targetPath: 'title',
        mode: 'assign',
      },
    ];

    const { container } = render(
      wrap(<FieldAssignRulesEditor t={t} fieldOptions={[]} value={value} showCondition={false} showEnable={false} />),
    );

    const questionIcons = Array.from(container.querySelectorAll('.anticon-question-circle'));
    expect(questionIcons).toHaveLength(2);

    await userEvent.hover(questionIcons[0] as Element);
    await waitFor(() => {
      expect(
        screen.getByText(
          'A pre-filled value. Editable, for new entries only, and won’t affect existing data (including empty values).',
        ),
      ).toBeInTheDocument();
    });

    await userEvent.unhover(questionIcons[0] as Element);

    await userEvent.hover(questionIcons[1] as Element);
    await waitFor(() => {
      expect(screen.getByText('A system-set value. Read-only.')).toBeInTheDocument();
    });
  });

  it('merges extra item tree into base item while keeping order', () => {
    const base: MetaTreeNode[] = [
      { name: 'formValues', title: 'Current form', type: 'object', paths: ['formValues'] },
      {
        name: 'item',
        title: 'Current item（o2m）',
        type: 'object',
        paths: ['item'],
        children: [
          {
            name: 'attributes',
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
            name: 'attributes',
            title: 'Attributes',
            type: 'object',
            paths: ['item', 'value'],
          },
          {
            name: 'parentItem',
            title: 'Parent item（m2m）',
            type: 'object',
            paths: ['item', 'parentItem'],
            children: [
              { name: 'index', title: 'Index (starts from 0)', type: 'number', paths: ['item', 'parentItem', 'index'] },
              {
                name: 'attributes',
                title: 'Attributes',
                type: 'object',
                paths: ['item', 'parentItem', 'value'],
              },
            ],
          },
        ],
      },
    ];

    const merged = mergeItemMetaTreeForAssignValue(base, extra);
    expect(merged.map((node) => node.name)).toEqual(['formValues', 'item', 'user']);
    expect(merged.filter((node) => node.name === 'item')).toHaveLength(1);

    const itemNode = merged.find((node) => node.name === 'item')!;
    const parent = (itemNode.children as MetaTreeNode[]).find((node) => node.name === 'parentItem');
    expect(parent).toBeTruthy();

    const nestedParent = ((parent?.children as MetaTreeNode[]) || []).find((node) => node.name === 'parentItem');
    expect(nestedParent).toBeTruthy();
    expect(nestedParent?.paths).toEqual(['item', 'parentItem']);
    expect(nestedParent?.title).toBe('Parent item（o2m）');
  });

  it('keeps base tree when extra has no item node', () => {
    const base: MetaTreeNode[] = [
      { name: 'formValues', title: 'Current form', type: 'object', paths: ['formValues'] },
      { name: 'item', title: 'Current item', type: 'object', paths: ['item'] },
    ];
    const extra: MetaTreeNode[] = [
      { name: 'collection', title: 'Current collection', type: 'object', paths: ['collection'] },
    ];

    const merged = mergeItemMetaTreeForAssignValue(base, extra);
    expect(merged).toEqual(base);
  });
});
