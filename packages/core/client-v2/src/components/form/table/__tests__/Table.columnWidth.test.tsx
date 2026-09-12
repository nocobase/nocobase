/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { fireEvent, render } from '@testing-library/react';
import { css } from '@emotion/css';
import { ConfigProvider, Table as AntdTable } from 'antd';
import type { ColumnsType } from 'antd/es/table/interface';
import type { RenderedCell } from 'rc-table/lib/interface';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Table, type TableProps } from '../Table';

type Row = {
  id: number;
  name: string;
  note: string;
};

const row: Row = {
  id: 1,
  name: 'Long unbroken content',
  note: 'Secondary content',
};

const defaultColumnMaxWidth = 400;
const defaultColumnContentClassName = 'nb-table-default-column-content';

function getMatchingStyleValues(element: Element, property: string) {
  return Array.from(document.styleSheets).flatMap((styleSheet) => {
    try {
      return Array.from(styleSheet.cssRules).flatMap((rule) => {
        if (!(rule instanceof CSSStyleRule)) return [];
        try {
          return element.matches(rule.selectorText) ? [rule.style.getPropertyValue(property)] : [];
        } catch {
          return [];
        }
      });
    } catch {
      return [];
    }
  });
}

function renderTable(columns: ColumnsType<Row>, props: Partial<TableProps<Row>> = {}) {
  return render(
    <ConfigProvider
      theme={{
        token: {
          screenXS: 500,
          paddingXL: 40,
          padding: 10,
        },
      }}
    >
      <Table<Row> rowKey="id" columns={columns} dataSource={[row]} pagination={false} {...props} />
    </ConfigProvider>,
  );
}

function getResolvedMaxWidth(element: HTMLElement) {
  const style = window.getComputedStyle(element);
  const variableName = style.maxWidth.match(/^var\((--[^)]+)\)$/)?.[1];
  return variableName ? style.getPropertyValue(variableName).trim() : style.maxWidth;
}

function expectDefaultWrappingStyle(element: Element | null) {
  expect(element).not.toBeNull();
  const htmlElement = element as HTMLElement;
  const style = window.getComputedStyle(htmlElement);
  expect(htmlElement.classList).toContain(defaultColumnContentClassName);
  expect(getResolvedMaxWidth(htmlElement)).toBe(`${defaultColumnMaxWidth}px`);
  expect(style.whiteSpace).toBe('normal');
  expect(style.overflowWrap).toBe('break-word');
  expect(style.wordBreak).toBe('break-word');
}

function expectNoDefaultWrappingStyle(element: Element | null) {
  expect(element).not.toBeNull();
  const htmlElement = element as HTMLElement;
  expect(htmlElement.classList).not.toContain(defaultColumnContentClassName);
  expect(getResolvedMaxWidth(htmlElement)).not.toBe(`${defaultColumnMaxWidth}px`);
}

describe('Table default column content width', () => {
  it('adds token-derived wrapping styles to unconstrained leaf headers and cells', () => {
    const { getByRole } = renderTable([{ title: 'Name', dataIndex: 'name' }]);

    expectDefaultWrappingStyle(getByRole('columnheader', { name: 'Name' }));
    expectDefaultWrappingStyle(getByRole('cell', { name: row.name }));
  });

  it('leaves columns with explicit width, ellipsis, or fixed positioning unchanged', () => {
    const columns: ColumnsType<Row> = [
      { title: 'Width', dataIndex: 'name', width: 240 },
      { title: 'Ellipsis', dataIndex: 'note', ellipsis: true },
      { title: 'Fixed', dataIndex: 'id', fixed: 'left' },
    ];
    const { getByRole } = renderTable(columns, { scroll: { x: 800 } });

    for (const title of ['Width', 'Ellipsis', 'Fixed']) {
      expectNoDefaultWrappingStyle(getByRole('columnheader', { name: title }));
    }

    const widthCell = getByRole('cell', { name: row.name });
    const ellipsisCell = getByRole('cell', { name: row.note });
    const fixedCell = getByRole('cell', { name: String(row.id) });
    for (const cell of [widthCell, ellipsisCell, fixedCell]) {
      expectNoDefaultWrappingStyle(cell);
    }
    expect(ellipsisCell.classList).toContain('ant-table-cell-ellipsis');
    expect(window.getComputedStyle(ellipsisCell).whiteSpace).toBe('nowrap');
  });

  it('preserves cell callbacks and lets caller styles override the defaults', () => {
    const handleClick = vi.fn();
    const onCell = vi.fn(() => ({
      colSpan: 2,
      className: 'custom-body-cell',
      onClick: handleClick,
      style: {
        maxWidth: 120,
        whiteSpace: 'pre' as const,
      },
    }));
    const onHeaderCell = vi.fn(() => ({
      colSpan: 2,
      className: 'custom-header-cell',
      style: {
        maxWidth: 180,
        overflowWrap: 'normal' as const,
      },
    }));
    const columns: ColumnsType<Row> = [
      { title: 'Name', dataIndex: 'name', onCell, onHeaderCell },
      { title: 'Note', dataIndex: 'note', width: 100 },
    ];
    const { container } = renderTable(columns);

    const header = container.querySelector<HTMLElement>('th.custom-header-cell');
    expect(header?.getAttribute('colspan')).toBe('2');
    const headerStyle = window.getComputedStyle(header as HTMLElement);
    expect(headerStyle.maxWidth).toBe('180px');
    expect(headerStyle.whiteSpace).toBe('normal');
    expect(headerStyle.overflowWrap).toBe('normal');
    expect(headerStyle.wordBreak).toBe('break-word');

    const cell = container.querySelector<HTMLElement>('td.custom-body-cell');
    expect(cell?.getAttribute('colspan')).toBe('2');
    const cellStyle = window.getComputedStyle(cell as HTMLElement);
    expect(cellStyle.maxWidth).toBe('120px');
    expect(cellStyle.whiteSpace).toBe('pre');
    expect(cellStyle.overflowWrap).toBe('break-word');
    expect(cellStyle.wordBreak).toBe('break-word');

    fireEvent.click(cell as HTMLElement);
    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(onCell).toHaveBeenCalledWith(row, 0);
    expect(onHeaderCell).toHaveBeenCalledWith(expect.objectContaining({ title: 'Name' }));
  });

  it('keeps the default wrapping behavior when caller classNames have no styles', () => {
    const columns: ColumnsType<Row> = [
      {
        title: 'Name',
        dataIndex: 'name',
        className: 'column-marker',
        onCell: () => ({ className: 'body-marker' }),
        onHeaderCell: () => ({ className: 'header-marker' }),
      },
      {
        title: 'Note',
        dataIndex: 'note',
        render: () => ({ children: 'Rendered marker', props: { className: 'render-marker' } }),
      },
    ];
    const { getByRole } = renderTable(columns);

    const nameHeader = getByRole('columnheader', { name: 'Name' });
    const nameCell = getByRole('cell', { name: row.name });
    const renderedCell = getByRole('cell', { name: 'Rendered marker' });
    expect(nameHeader.classList).toContain('column-marker');
    expect(nameHeader.classList).toContain('header-marker');
    expect(nameCell.classList).toContain('column-marker');
    expect(nameCell.classList).toContain('body-marker');
    expect(renderedCell.classList).toContain('render-marker');
    for (const element of [nameHeader, nameCell, renderedCell]) {
      expectDefaultWrappingStyle(element);
    }
  });

  it('lets caller className styles override the defaults', () => {
    const callerClassName = css`
      max-width: 135px;
      white-space: pre;
      overflow-wrap: normal;
      word-break: normal;
    `;
    const columns: ColumnsType<Row> = [
      {
        title: 'Name',
        dataIndex: 'name',
        onCell: () => ({ className: callerClassName }),
        onHeaderCell: () => ({ className: callerClassName }),
      },
      { title: 'Note', dataIndex: 'note', className: callerClassName },
    ];
    // Use a distinct token value so this render creates its default Emotion class after the caller class. This
    // catches source-order regressions that would be hidden if a previous test had already inserted the default rule.
    const { getByRole } = render(
      <ConfigProvider theme={{ token: { screenXS: 501, paddingXL: 40, padding: 10 } }}>
        <Table<Row> rowKey="id" columns={columns} dataSource={[row]} pagination={false} />
      </ConfigProvider>,
    );

    for (const element of [
      getByRole('columnheader', { name: 'Name' }),
      getByRole('columnheader', { name: 'Note' }),
      getByRole('cell', { name: row.name }),
      getByRole('cell', { name: row.note }),
    ]) {
      const style = window.getComputedStyle(element);
      expect(getResolvedMaxWidth(element)).toBe('135px');
      expect(style.whiteSpace).toBe('pre');
      expect(style.overflowWrap).not.toBe('anywhere');
      expect(getMatchingStyleValues(element, 'overflow-wrap')).toContain('normal');
      expect(style.wordBreak).toBe('normal');
    }
  });

  it('lets className returned from render override the defaults on first mount', () => {
    const callerClassName = css`
      max-width: 136px;
      white-space: pre;
      overflow-wrap: normal;
      word-break: normal;
    `;
    const renderedCell: RenderedCell<Row> = {
      props: { className: callerClassName },
    };
    const { container } = render(
      <ConfigProvider theme={{ token: { screenXS: 502, paddingXL: 40, padding: 10 } }}>
        <Table<Row>
          rowKey="id"
          columns={[{ title: 'Name', dataIndex: 'name', render: () => renderedCell }]}
          dataSource={[row]}
          pagination={false}
        />
      </ConfigProvider>,
    );

    const cell = container.querySelector<HTMLElement>('.ant-table-tbody td');
    expect(cell).not.toBeNull();
    const htmlCell = cell as HTMLElement;
    const style = window.getComputedStyle(htmlCell);
    expect(getResolvedMaxWidth(htmlCell)).toBe('136px');
    expect(style.whiteSpace).toBe('pre');
    expect(style.overflowWrap).not.toBe('anywhere');
    expect(getMatchingStyleValues(cell as HTMLElement, 'overflow-wrap')).toContain('normal');
    expect(style.wordBreak).toBe('normal');
  });

  it('lets static caller className styles override defaults inserted later', () => {
    const callerClassName = 'caller-static-table-column';
    const callerStyle = document.createElement('style');
    callerStyle.textContent = `
      .${callerClassName} {
        max-width: 137px;
        white-space: pre;
        overflow-wrap: normal;
        word-break: normal;
      }
    `;
    document.head.prepend(callerStyle);

    try {
      const columns: ColumnsType<Row> = [
        {
          title: 'Name',
          dataIndex: 'name',
          onCell: () => ({ className: callerClassName }),
          onHeaderCell: () => ({ className: callerClassName }),
        },
        { title: 'Note', dataIndex: 'note', className: callerClassName },
        {
          title: 'Rendered',
          dataIndex: 'id',
          render: () => ({ props: { className: callerClassName } }),
        },
      ];
      const { container, getByRole } = render(
        <ConfigProvider theme={{ token: { screenXS: 503, paddingXL: 40, padding: 10 } }}>
          <Table<Row> rowKey="id" columns={columns} dataSource={[row]} pagination={false} />
        </ConfigProvider>,
      );
      const cells = Array.from(container.querySelectorAll<HTMLElement>('.ant-table-tbody td'));

      for (const element of [
        getByRole('columnheader', { name: 'Name' }),
        getByRole('columnheader', { name: 'Note' }),
        cells[0],
        cells[1],
        cells[2],
      ]) {
        expect(element).toBeDefined();
        const htmlElement = element as HTMLElement;
        const style = window.getComputedStyle(htmlElement);
        expect(getResolvedMaxWidth(htmlElement)).toBe('137px');
        expect(style.whiteSpace).toBe('pre');
        expect(style.overflowWrap).not.toBe('anywhere');
        expect(getMatchingStyleValues(htmlElement, 'overflow-wrap')).toContain('normal');
        expect(style.wordBreak).toBe('normal');
      }
    } finally {
      callerStyle.remove();
    }
  });

  it('lets styles returned from render override the defaults', () => {
    const renderedCell: RenderedCell<Row> = {
      children: 'Rendered cell',
      props: {
        className: 'rendered-cell',
        style: {
          maxWidth: 123,
          whiteSpace: 'pre',
          overflowWrap: 'normal',
          wordBreak: 'normal',
        },
      },
    };
    const { getByRole } = renderTable([{ title: 'Name', dataIndex: 'name', render: () => renderedCell }]);

    const style = window.getComputedStyle(getByRole('cell', { name: 'Rendered cell' }));
    expect(style.maxWidth).toBe('123px');
    expect(style.whiteSpace).toBe('pre');
    expect(style.overflowWrap).toBe('normal');
    expect(style.wordBreak).toBe('normal');
  });

  it('processes only leaves in nested columns without mutating the input', () => {
    const nameColumn = { title: 'Name', dataIndex: 'name' as const };
    const noteColumn = { title: 'Note', dataIndex: 'note' as const };
    const children = [nameColumn, noteColumn];
    const groupColumn = { title: 'Details', children };
    const columns: ColumnsType<Row> = [groupColumn];

    const { getByRole } = renderTable(columns);

    expectNoDefaultWrappingStyle(getByRole('columnheader', { name: 'Details' }));
    expectDefaultWrappingStyle(getByRole('columnheader', { name: 'Name' }));
    expectDefaultWrappingStyle(getByRole('columnheader', { name: 'Note' }));
    expectDefaultWrappingStyle(getByRole('cell', { name: row.name }));
    expectDefaultWrappingStyle(getByRole('cell', { name: row.note }));

    expect(columns[0]).toBe(groupColumn);
    expect(groupColumn.children).toBe(children);
    expect(children[0]).toBe(nameColumn);
    expect(children[1]).toBe(noteColumn);
    expect(nameColumn).not.toHaveProperty('onCell');
    expect(nameColumn).not.toHaveProperty('onHeaderCell');
    expect(noteColumn).not.toHaveProperty('onCell');
    expect(noteColumn).not.toHaveProperty('onHeaderCell');
  });

  it('does not apply the default boundary to selection or drag-handle columns', () => {
    const columns: ColumnsType<Row> = [{ title: 'Name', dataIndex: 'name' }];
    const selectionTable = renderTable(columns, { rowSelection: {} });

    expectNoDefaultWrappingStyle(selectionTable.container.querySelector<HTMLElement>('th.ant-table-selection-column'));
    expectNoDefaultWrappingStyle(selectionTable.container.querySelector<HTMLElement>('td.ant-table-selection-column'));
    expectDefaultWrappingStyle(selectionTable.getByRole('columnheader', { name: 'Name' }));
    selectionTable.unmount();

    const dragTable = renderTable(columns, { isDraggable: true, onSortEnd: vi.fn() });
    const dragHeader = dragTable.container.querySelector<HTMLElement>('.ant-table-thead th:first-child');
    const dragCell = dragTable.container.querySelector<HTMLElement>('.ant-table-tbody td:first-child');

    expectNoDefaultWrappingStyle(dragHeader);
    expectNoDefaultWrappingStyle(dragCell);
    expectDefaultWrappingStyle(dragTable.getByRole('columnheader', { name: 'Name' }));
  });

  it('preserves Ant Design sentinels used to position expand and selection columns', () => {
    const columns: ColumnsType<Row> = [
      { title: 'Name', dataIndex: 'name' },
      AntdTable.EXPAND_COLUMN,
      AntdTable.SELECTION_COLUMN,
      { title: 'Note', dataIndex: 'note' },
    ];
    const { container } = renderTable(columns, {
      expandable: { expandedRowRender: (record) => <span>{record.note}</span> },
      rowSelection: {},
    });

    const headers = Array.from(container.querySelectorAll<HTMLElement>('.ant-table-thead th'));
    expect(headers).toHaveLength(4);
    expect(headers[0].textContent).toBe('Name');
    expect(headers[1].classList).toContain('ant-table-row-expand-icon-cell');
    expect(headers[2].classList).toContain('ant-table-selection-column');
    expect(headers[3].textContent).toBe('Note');
    expectNoDefaultWrappingStyle(headers[1]);
    expectNoDefaultWrappingStyle(headers[2]);
  });

  it('treats empty, undefined, or null children as leaves like antd', () => {
    const columns = [
      { title: 'Empty children', dataIndex: 'name', children: [] },
      { title: 'Undefined children', dataIndex: 'note', children: undefined },
      { title: 'Null children', dataIndex: 'id', children: null },
    ] as unknown as ColumnsType<Row>;
    const { getByRole } = renderTable(columns);

    expectDefaultWrappingStyle(getByRole('columnheader', { name: 'Empty children' }));
    expectDefaultWrappingStyle(getByRole('columnheader', { name: 'Undefined children' }));
    expectDefaultWrappingStyle(getByRole('columnheader', { name: 'Null children' }));
    expectDefaultWrappingStyle(getByRole('cell', { name: row.name }));
    expectDefaultWrappingStyle(getByRole('cell', { name: row.note }));
    expectDefaultWrappingStyle(getByRole('cell', { name: String(row.id) }));
  });

  it('does not force fixed table layout', () => {
    const { container } = renderTable([{ title: 'Name', dataIndex: 'name' }]);

    expect(container.querySelector<HTMLTableElement>('table')?.style.tableLayout).not.toBe('fixed');
  });
});
