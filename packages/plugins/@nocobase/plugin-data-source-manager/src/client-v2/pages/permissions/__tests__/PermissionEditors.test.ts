/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  applyActionScope,
  normalizeActions,
  RoleResourceActionsEditor,
  StrategyActionsEditor,
} from '../PermissionEditors';

vi.mock('@nocobase/client-v2', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nocobase/client-v2')>();
  const ReactModule = await import('react');

  type TestColumn = {
    dataIndex?: string | string[];
    render?: (value: unknown, record: Record<string, unknown>, index: number) => React.ReactNode;
    title?: React.ReactNode;
  };

  function getCellValue(record: Record<string, unknown>, dataIndex?: string | string[]) {
    if (Array.isArray(dataIndex)) {
      return dataIndex.reduce<unknown>(
        (memo, key) => (memo && typeof memo === 'object' ? (memo as Record<string, unknown>)[key] : undefined),
        record,
      );
    }
    return dataIndex ? record[dataIndex] : undefined;
  }

  return {
    ...actual,
    Table: ({
      columns,
      dataSource,
      rowKey = 'name',
    }: {
      columns: TestColumn[];
      dataSource?: Record<string, unknown>[];
      rowKey?: string;
    }) =>
      ReactModule.createElement(
        'div',
        { 'data-testid': 'permission-table' },
        ReactModule.createElement(
          'div',
          { 'data-testid': 'permission-table-header' },
          columns.map((column, index) => ReactModule.createElement('span', { key: index }, column.title)),
        ),
        (dataSource || []).map((record, rowIndex) =>
          ReactModule.createElement(
            'div',
            {
              key: String(record[rowKey]),
              'data-testid': `permission-row-${String(record[rowKey])}`,
            },
            columns.map((column, columnIndex) =>
              ReactModule.createElement(
                'span',
                { key: columnIndex },
                column.render
                  ? column.render(getCellValue(record, column.dataIndex), record, rowIndex)
                  : String(getCellValue(record, column.dataIndex) ?? ''),
              ),
            ),
          ),
        ),
      ),
  };
});

const availableActions = [
  {
    name: 'view',
    displayName: '{{t("View")}}',
    allowConfigureFields: true,
  },
  {
    name: 'create',
    displayName: '{{t("Create")}}',
    allowConfigureFields: true,
    onNewRecord: true,
  },
];

const collectionFields = [
  { name: 'title', uiSchema: { title: '{{t("Title")}}' } },
  { name: 'status', uiSchema: { title: 'Status' } },
];

const t = (key: string) => `t:${key}`;

describe('permission editors', () => {
  it('falls back to scopeId when appended scope is empty', () => {
    expect(
      normalizeActions([
        {
          name: 'view',
          fields: ['title'],
          scopeId: 123,
          scope: {},
        },
      ]),
    ).toEqual({
      view: {
        name: 'view',
        fields: ['title'],
        scopeId: 123,
        scope: { id: 123 },
      },
    });
  });

  it('enables an action with all fields when setting scope on a disabled action', () => {
    expect(applyActionScope({}, 'view', { id: 1 }, [{ name: 'title' }, { name: 'status' }])).toEqual({
      view: {
        name: 'view',
        fields: ['title', 'status'],
        scope: { id: 1 },
      },
    });
  });

  it('preserves existing action fields when updating scope', () => {
    expect(
      applyActionScope(
        {
          view: {
            name: 'view',
            fields: ['title'],
          },
        },
        'view',
        { id: 2 },
        [{ name: 'title' }, { name: 'status' }],
      ),
    ).toEqual({
      view: {
        name: 'view',
        fields: ['title'],
        scope: { id: 2 },
      },
    });
  });

  it('updates strategy action permissions when toggling existing and new actions', () => {
    const onChange = vi.fn();

    render(
      React.createElement(StrategyActionsEditor, {
        availableActions,
        onChange,
        t,
        value: ['view:own'],
      }),
    );

    fireEvent.click(within(screen.getByTestId('permission-row-view')).getByRole('checkbox'));
    expect(onChange).toHaveBeenLastCalledWith([]);

    fireEvent.click(within(screen.getByTestId('permission-row-create')).getByRole('checkbox'));
    expect(onChange).toHaveBeenLastCalledWith(expect.arrayContaining(['view:own', 'create']));
  });

  it('updates role resource actions, scopes, and field permissions', () => {
    const onChange = vi.fn();

    render(
      React.createElement(RoleResourceActionsEditor, {
        availableActions,
        collectionFields,
        onChange,
        renderScopeSelect: ({ action, onChange: onScopeChange }) =>
          React.createElement(
            'button',
            {
              onClick: () => onScopeChange({ id: 9 }),
              type: 'button',
            },
            `Scope ${action.name}`,
          ),
        t,
        value: [
          {
            name: 'view',
            fields: ['title'],
            scope: { id: 1 },
          },
        ],
      }),
    );

    fireEvent.click(screen.getByText('Scope view'));
    expect(onChange).toHaveBeenLastCalledWith([
      expect.objectContaining({
        name: 'view',
        fields: ['title'],
        scope: { id: 9 },
      }),
    ]);

    fireEvent.click(within(screen.getByTestId('permission-row-status')).getAllByRole('checkbox')[0]);
    expect(onChange).toHaveBeenLastCalledWith([
      expect.objectContaining({
        name: 'view',
        fields: ['title', 'status'],
      }),
    ]);

    fireEvent.click(within(screen.getByTestId('permission-row-view')).getByRole('checkbox'));
    expect(onChange).toHaveBeenLastCalledWith([]);
  });
});
