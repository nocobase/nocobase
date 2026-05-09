/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { EventEmitter } from 'events';
import { describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@nocobase/test/client';
import { SubTableField } from '../SubTableField';

vi.mock('react-i18next', async (importOriginal) => ({
  ...(await importOriginal<any>()),
  useTranslation: () => ({
    t: (value: string) => value,
  }),
}));

vi.mock('antd', async () => {
  const actual = await vi.importActual<any>('antd');
  return {
    ...actual,
    Table: ({ dataSource = [], columns = [] }: any) => (
      <div data-testid="subtable">
        {dataSource.map((record: any, rowIdx: number) => (
          <div data-testid={`row-${rowIdx}`} key={record.__index__ || rowIdx}>
            {columns.map((column: any) => (
              <div data-testid={`cell-${rowIdx}-${String(column.dataIndex || column.key)}`} key={column.key}>
                {column.render?.(record[column.dataIndex], record, rowIdx)}
              </div>
            ))}
          </div>
        ))}
      </div>
    ),
  };
});

describe('SubTableField refresh', () => {
  it('rerenders from current form value when a nested subtable path changes', () => {
    const emitter = new EventEmitter();
    const store = {
      roles: [{ __is_new__: true, __index__: 'row-1', uid: 'role-uid-1', name: '' }],
    };
    const columns = [
      {
        key: 'name',
        dataIndex: 'name',
        render: ({ value }: any) => <span>{value || 'empty'}</span>,
      },
    ];

    render(
      <SubTableField
        columns={columns}
        pageSize={10}
        filterTargetKey="id"
        fieldPathArray={['roles']}
        formValuesChangeEmitter={emitter}
        getCurrentValue={() => store.roles}
      />,
    );

    expect(screen.getByTestId('cell-0-name')).toHaveTextContent('empty');

    act(() => {
      store.roles = [{ ...store.roles[0], name: 'role-uid-1' }];
      emitter.emit('formValuesChange', {
        source: 'linkage',
        changedPaths: [['roles', 0, 'name']],
      });
    });

    expect(screen.getByTestId('cell-0-name')).toHaveTextContent('role-uid-1');
  });

  it('ignores unrelated form value changes', () => {
    const emitter = new EventEmitter();
    let renderCount = 0;
    const store = {
      roles: [{ __is_new__: true, __index__: 'row-1', uid: 'role-uid-1', name: '' }],
    };
    const columns = [
      {
        key: 'name',
        dataIndex: 'name',
        render: ({ value }: any) => {
          renderCount += 1;
          return <span>{value || 'empty'}</span>;
        },
      },
    ];

    render(
      <SubTableField
        columns={columns}
        pageSize={10}
        filterTargetKey="id"
        fieldPathArray={['roles']}
        formValuesChangeEmitter={emitter}
        getCurrentValue={() => store.roles}
      />,
    );

    expect(renderCount).toBe(1);

    act(() => {
      store.roles = [{ ...store.roles[0], name: 'role-uid-1' }];
      emitter.emit('formValuesChange', {
        source: 'user',
        changedPaths: [['profile', 'name']],
      });
    });

    expect(renderCount).toBe(1);
    expect(screen.getByTestId('cell-0-name')).toHaveTextContent('empty');
  });
});
