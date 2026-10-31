/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@nocobase/test/client';
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
        <div data-testid="column-keys">{columns.map((column: any) => String(column.key)).join(',')}</div>
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

function renderSubTableField(disabled?: boolean) {
  const renderArgs: any[] = [];
  const columns = [
    {
      key: 'name',
      dataIndex: 'name',
      render: (args: any) => {
        renderArgs.push(args);
        return <span>{args.value || 'empty'}</span>;
      },
    },
  ];

  render(
    <SubTableField
      columns={columns}
      disabled={disabled}
      pageSize={10}
      filterTargetKey="id"
      fieldPathArray={['roles']}
      getCurrentValue={() => [{ __index__: 'row-1', id: 1, name: 'admin' }]}
    />,
  );

  return renderArgs;
}

describe('SubTableField disabled', () => {
  it('passes the disabled state down to every column cell', () => {
    const renderArgs = renderSubTableField(true);

    expect(renderArgs).toHaveLength(1);
    expect(renderArgs[0].disabled).toBe(true);
  });

  it('keeps cells editable when the sub-table is not disabled', () => {
    const renderArgs = renderSubTableField(false);

    expect(renderArgs).toHaveLength(1);
    expect(renderArgs[0].disabled).toBe(false);
  });

  it('hides the remove column when the sub-table is disabled', () => {
    renderSubTableField(true);

    expect(screen.getByTestId('column-keys')).not.toHaveTextContent('delete');
  });
});
