/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { render } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS, Table } from '../Table';

type Row = { id: number; name: string };

const columns = [{ title: 'Name', dataIndex: 'name' as const }];

function makeRows(count: number): Row[] {
  return Array.from({ length: count }, (_, index) => ({ id: index + 1, name: `row-${index + 1}` }));
}

describe('Table pagination defaults', () => {
  it('exports DEFAULT_PAGE_SIZE=50 and the v1-aligned PAGE_SIZE_OPTIONS list', () => {
    expect(DEFAULT_PAGE_SIZE).toBe(50);
    expect([...PAGE_SIZE_OPTIONS]).toEqual([5, 10, 20, 50, 100, 200]);
  });

  it('shows the page-size changer by default when pagination is enabled', () => {
    const { container } = render(
      <Table<Row>
        rowKey="id"
        columns={columns}
        dataSource={makeRows(120)}
        pagination={{ current: 1, pageSize: 50, total: 120 }}
      />,
    );
    expect(container.querySelector('.ant-pagination-options-size-changer')).not.toBeNull();
  });

  it('shows the page-size changer when caller omits pagination entirely', () => {
    const { container } = render(<Table<Row> rowKey="id" columns={columns} dataSource={makeRows(120)} />);
    expect(container.querySelector('.ant-pagination-options-size-changer')).not.toBeNull();
  });

  it('renders no pagination at all when caller passes pagination={false}', () => {
    const { container } = render(
      <Table<Row> rowKey="id" columns={columns} dataSource={makeRows(120)} pagination={false} />,
    );
    expect(container.querySelector('.ant-pagination')).toBeNull();
  });

  it('lets caller-provided showSizeChanger=false override the default', () => {
    const { container } = render(
      <Table<Row>
        rowKey="id"
        columns={columns}
        dataSource={makeRows(120)}
        pagination={{ current: 1, pageSize: 50, total: 120, showSizeChanger: false }}
      />,
    );
    expect(container.querySelector('.ant-pagination-options-size-changer')).toBeNull();
  });

  it('preserves caller-controlled current page when caller passes a pagination object', () => {
    const { container } = render(
      <Table<Row>
        rowKey="id"
        columns={columns}
        dataSource={makeRows(120)}
        pagination={{ current: 2, pageSize: 50, total: 120 }}
      />,
    );
    // antd marks the active page with `.ant-pagination-item-active` and the
    // page number lives inside an <a> child — checking the rendered text is
    // the most stable assertion across antd versions.
    const active = container.querySelector('.ant-pagination-item-active');
    expect(active?.textContent).toBe('2');
  });
});
