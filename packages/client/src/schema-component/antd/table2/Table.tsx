import { MenuOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import { ArrayField } from '@formily/core';
import { observer, RecursionField, Schema, useField, useFieldSchema } from '@formily/react';
import { Table as AntdTable, TableColumnProps } from 'antd';
import { default as classNames, default as cls } from 'classnames';
import React, { useEffect } from 'react';
import ReactDragListView from 'react-drag-listview';
import { DndContext } from '../..';
import { RecordIndexProvider, RecordProvider, useSchemaInitializer } from '../../../';

const isColumnComponent = (schema: Schema) => {
  return schema['x-component']?.endsWith('.Column') > -1;
};

const useTableColumns = () => {
  const field = useField<ArrayField>();
  const schema = useFieldSchema();
  const { exists, render } = useSchemaInitializer(schema['x-initializer']);
  const columns = schema
    .reduceProperties((buf, s) => {
      if (isColumnComponent(s)) {
        return buf.concat([s]);
      }
    }, [])
    .map((s: Schema) => {
      return {
        title: <RecursionField name={s.name} schema={s} onlyRenderSelf />,
        dataIndex: s.name,
        key: s.name,
        render: (v, record) => {
          const index = field.value?.indexOf(record);
          return (
            <RecordIndexProvider index={index}>
              <RecordProvider record={record}>
                <RecursionField schema={s} name={index} onlyRenderProperties />
              </RecordProvider>
            </RecordIndexProvider>
          );
        },
      } as TableColumnProps<any>;
    });
  if (!exists) {
    return columns;
  }
  return columns.concat({
    title: render(),
    dataIndex: 'TABLE_COLUMN_INITIALIZER',
    key: 'TABLE_COLUMN_INITIALIZER',
  });
};

export const components = {
  header: {
    wrapper: (props) => {
      return (
        <DndContext>
          <thead {...props} />
        </DndContext>
      );
    },
    cell: (props) => {
      return (
        <th
          {...props}
          className={cls(
            props.className,
            css`
              &:hover .general-schema-designer {
                display: block;
              }
            `,
          )}
        />
      );
    },
  },
  body: {
    wrapper: (props) => {
      return (
        <DndContext>
          <tbody {...props} />
        </DndContext>
      );
    },
    row: (props) => {
      return <tr {...props} />;
    },
    cell: (props) => (
      <td
        {...props}
        className={classNames(
          props.className,
          css`
            max-width: 300px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          `,
        )}
      />
    ),
  },
};

const SortHandle = () => {
  return <MenuOutlined className={'drag-handle'} style={{ cursor: 'grab' }} />;
};

const TableIndex = (props) => {
  const { index } = props;
  return (
    <div className={classNames('nb-table-index')} style={{ padding: '0 8px 0 16px' }}>
      {index + 1}
    </div>
  );
};

export const TableV2: any = observer((props: any) => {
  const field = useField<ArrayField>();
  const columns = useTableColumns();
  const { dragSort = false, showIndex = true, useEvents, onChange, ...others } = props;
  const { onLoad, onRowSelectionChange } = useEvents?.() || {};
  useEffect(() => {
    onLoad?.();
  }, []);
  const restProps = {
    rowSelection: props.rowSelection
      ? {
          type: 'checkbox',
          selectedRowKeys: field?.data?.selectedRowKeys || [],
          onChange(selectedRowKeys: any[], selectedRows: any[]) {
            field.data = field.data || {};
            field.data.selectedRowKeys = selectedRowKeys;
            onRowSelectionChange?.(selectedRowKeys, selectedRows);
          },
          renderCell: (checked, record, index, originNode) => {
            const current = props?.pagination?.current;
            const pageSize = props?.pagination?.pageSize || 20;
            if (current) {
              index = index + (current - 1) * pageSize;
            }
            return (
              <div
                className={classNames(
                  checked ? 'checked' : null,
                  css`
                    position: relative;
                    display: flex;
                    align-items: center;
                    justify-content: space-evenly;
                    padding-right: 8px;
                    .nb-table-index {
                      opacity: 0;
                    }
                    &:not(.checked) {
                      .nb-table-index {
                        opacity: 1;
                      }
                    }
                    &:hover {
                      .nb-table-index {
                        opacity: 0;
                      }
                      .nb-origin-node {
                        display: block;
                      }
                    }
                  `,
                )}
              >
                <div
                  className={classNames(
                    checked ? 'checked' : null,
                    css`
                      position: relative;
                      display: flex;
                      align-items: center;
                      justify-content: space-evenly;
                    `,
                  )}
                >
                  {dragSort && <SortHandle />}
                  {showIndex && <TableIndex index={index} />}
                </div>
                <div
                  className={classNames(
                    'nb-origin-node',
                    checked ? 'checked' : null,
                    css`
                      position: absolute;
                      right: 50%;
                      transform: translateX(50%);
                      &:not(.checked) {
                        display: none;
                      }
                    `,
                  )}
                >
                  {originNode}
                </div>
              </div>
            );
          },
          ...props.rowSelection,
        }
      : undefined,
  };

  const defaultRowKey = (record: any) => {
    return field.value?.indexOf?.(record);
  };

  return (
    <div>
      <ReactDragListView
        handleSelector={'.drag-handle'}
        onDragEnd={async (fromIndex, toIndex) => {
          const from = field.value[fromIndex];
          const to = field.value[toIndex];
          field.move(fromIndex, toIndex);
        }}
        lineClassName={css`
          border-bottom: 2px solid rgba(241, 139, 98, 0.6) !important;
        `}
      >
        <AntdTable
          loading={field.loading}
          rowKey={defaultRowKey}
          {...others}
          {...restProps}
          components={components}
          columns={columns}
          dataSource={field?.value?.slice?.()}
        />
      </ReactDragListView>
    </div>
  );
});

TableV2.Column = (props) => {
  const field = useField();
  return <div>{field.title}</div>;
};
