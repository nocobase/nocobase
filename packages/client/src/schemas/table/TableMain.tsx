import React, { useState } from 'react';
import { DndContext } from '@dnd-kit/core';
import { Table as AntdTable } from 'antd';
import { findIndex } from 'lodash';
import cls from 'classnames';
import { RecursionField, Schema } from '@formily/react';
import { isValid } from '@formily/shared';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableBodyRow, SortableHeaderCell, SortableHeaderRow } from './Sortable';
import { TableRowContext } from './context';
import { useDataSource } from './hooks/useDataSource';
import { useDefaultRowSelection } from './hooks/useDefaultRowSelection';
import { useTable } from './hooks/useTable';
import { useTableActionBars } from './hooks/useTableActionBars';
import { useTableColumns } from './hooks/useTableColumns';
import { Table } from './Table';

export const TableMain = () => {
  const {
    resource,
    selectedRowKeys,
    setSelectedRowKeys,
    service,
    field,
    props: { rowKey, dragSort, showIndex, onSelect, useRowSelection = useDefaultRowSelection },
    refresh,
  } = useTable();
  const columns = useTableColumns();
  const dataSource = useDataSource();
  const actionBars = useTableActionBars();
  const [html, setHtml] = useState('');
  const { type } = useRowSelection();
  return (
    <div className={'nb-table'}>
      <DndContext
        onDragEnd={async (event) => {
          const fromId = event.active?.id as any;
          const toId = event.over?.id as any;
          if (isValid(fromId) && isValid(toId)) {
            const fromIndex = findIndex(field.value, (item) => item[rowKey] === fromId);
            const toIndex = findIndex(field.value, (item) => item[rowKey] === toId);
            console.log({ fromId, toId, fromIndex, toIndex });
            field.move(fromIndex, toIndex);
            refresh();
            await resource.sort({
              resourceKey: fromId,
              target: {
                [rowKey]: toId,
              },
            });
            await service.refresh();
          }
        }}
      >
        {actionBars.map((actionBar) => (
          <RecursionField
            schema={
              new Schema({
                type: 'void',
                properties: {
                  [actionBar.name]: actionBar,
                },
              })
            }
          />
        ))}
        <SortableContext items={dataSource || []} strategy={verticalListSortingStrategy}>
          <AntdTable
            pagination={false}
            onChange={(pagination) => {}}
            loading={service?.loading}
            rowKey={rowKey}
            dataSource={dataSource}
            columns={columns}
            // components={{
            //   body: {
            //     row: DragableBodyRow,
            //   },
            // }}
            components={{
              header: {
                row: SortableHeaderRow,
                cell: SortableHeaderCell,
              },
              body: {
                // wrapper: (props) => {
                //   return (
                //     <tbody {...props}>
                //       <DragOverlay
                //         className={'ant-table-row'}
                //         wrapperElement={'tr'}
                //       >
                //         <div />
                //       </DragOverlay>
                //       {props.children}
                //     </tbody>
                //   );
                // },
                row: SortableBodyRow,
                // cell: SortableBodyCell,
              },
            }}
            rowSelection={{
              type: type || 'checkbox',
              selectedRowKeys,
              onChange: (rowKeys, rows) => {
                setSelectedRowKeys(rowKeys);
                onSelect && onSelect(rowKeys, rows);
              },
              renderCell: (checked, record, _, originNode) => {
                const index = findIndex(field.value, (item) => item[rowKey] === record[rowKey]);
                return (
                  <TableRowContext.Provider
                    value={{
                      index,
                      record,
                    }}
                  >
                    <div
                      className={cls('nb-table-selection', {
                        dragSort,
                        showIndex,
                      })}
                    >
                      {dragSort && <Table.SortHandle />}
                      {showIndex && <Table.Index />}
                      {originNode}
                    </div>
                  </TableRowContext.Provider>
                );
              },
            }}
          />
        </SortableContext>
      </DndContext>
      <Table.Pagination />
    </div>
  );
};
