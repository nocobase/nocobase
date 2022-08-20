import { MenuOutlined } from '@ant-design/icons';
import { SortableContext, useSortable } from '@dnd-kit/sortable';
import { css } from '@emotion/css';
import { ArrayField, Field } from '@formily/core';
import { ISchema, observer, RecursionField, Schema, useField, useFieldSchema } from '@formily/react';
import { reaction } from '@formily/reactive';
import { useMemoizedFn } from 'ahooks';
import { Table as AntdTable, TableColumnProps, Skeleton } from 'antd';
import { default as classNames, default as cls } from 'classnames';
import React, { useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { DndContext } from '../..';
import { useTableBlockContext } from '../../../block-provider/TableBlockProvider';
import { RecordIndexProvider, RecordProvider, useSchemaInitializer } from '../../../';

const isColumnComponent = (schema: Schema) => {
  return schema['x-component']?.endsWith('.Column') > -1;
};

const isCollectionFieldComponent = (schema: ISchema) => {
  return schema['x-component'] === 'CollectionField';
};

const topActiveClass = css`
  & > td {
    border-top: 2px solid rgba(241, 139, 98, 0.6) !important;
  }
`;
const bottomActiveClass = css`
  & > td {
    border-bottom: 2px solid rgba(241, 139, 98, 0.6) !important;
  }
`;

const SortableRow = (props) => {
  const id = props['data-row-key']?.toString();
  const { setNodeRef, isOver, active, over } = useSortable({
    id,
  });

  const className =
    (active?.data.current?.sortable.index ?? -1) > (over?.data.current?.sortable.index ?? -1)
      ? topActiveClass
      : bottomActiveClass;

  return (
    <tr
      ref={active?.id !== id ? setNodeRef : null}
      {...props}
      className={classNames({ [className]: active && isOver })}
    />
  );
};

const SortHandle = (props) => {
  const { listeners } = useSortable({
    id: props.id,
  });
  return <MenuOutlined {...listeners} style={{ cursor: 'grab' }} />;
};

const TableIndex = (props) => {
  const { index } = props;
  return (
    <div className={classNames('nb-table-index')} style={{ padding: '0 8px 0 16px' }}>
      {index + 1}
    </div>
  );
};

const usePaginationProps = (pagination1, pagination2) => {
  const { t } = useTranslation();
  if (pagination2 === false) {
    return false;
  }
  if (!pagination2 && pagination1 === false) {
    return false;
  }
  return {
    showTotal: (total) => t('Total {{count}} items', { count: total }),
    showSizeChanger: true,
    ...pagination1,
    ...pagination2,
  };
};

const useValidator = (validator: (value: any) => string) => {
  const field = useField<Field>();
  useEffect(() => {
    const dispose = reaction(
      () => field.value,
      (value) => {
        const message = validator(value);
        field.setFeedback({
          type: 'error',
          code: 'ValidateError',
          messages: message ? [message] : [],
        });
      },
    );
    return () => {
      dispose();
    };
  }, []);
};

const TdCell = (props: any) => {
  const { onMouseEnter, onMouseLeave, children, ...restProps } = props;
  return (
    <td
      {...restProps}
      children={children[1]}
      className={classNames(
        props.className,
        css`
          max-width: 300px;
          white-space: nowrap;
          .nb-read-pretty-input-number {
            text-align: right;
          }
        `,
      )}
    />
  );
};

export const Table: any = observer((props: any) => {
  const vnodeCache = [];
  const schema = useFieldSchema();
  const height = useTableBlockContext()?.height;
  const { exists, render } = useMemo(() => useSchemaInitializer(schema['x-initializer']), []);
  const field = useField<ArrayField>();
  const { pagination: pagination1, useProps, onChange, value, ...others1 } = props;
  const { pagination: pagination2, ...others2 } = useProps?.() || {};
  const {
    dragSort = false,
    showIndex = true,
    onRowSelectionChange,
    onChange: onTableChange,
    rowSelection,
    rowKey,
    required,
    ...others
  } = { ...others1, ...others2 } as any;
  const onRowDragEnd = useMemoizedFn(others.onRowDragEnd || (() => {}));
  const paginationProps = usePaginationProps(pagination1, pagination2);
  const requiredValidator = field.required || required;
  let [columnFlag, setColumnFlag] = React.useState(0);
  useEffect(() => {
    field.setValidator((value) => {
      if (requiredValidator) {
        return Array.isArray(value) && value.length > 0 ? null : 'The field value is required';
      }
      return;
    });
  }, [requiredValidator]);
  const components = useMemo(() => {
    return {
      header: {
        wrapper: (props) => {
          const { onMouseEnter, onMouseLeave, ...restProps } = props;
          return (
            <DndContext
              onDragEnd={() => {
                setColumnFlag(columnFlag++);
              }}
            >
              <thead {...restProps} />
            </DndContext>
          );
        },
        cell: (props) => {
          const { onMouseEnter, onMouseLeave, ...restProps } = props;
          return (
            <th
              {...restProps}
              className={cls(
                props.className,
                css`
                  max-width: 300px;
                  white-space: nowrap;
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
            <DndContext
              onDragEnd={(e) => {
                if (!e.active || !e.over) {
                  console.warn('move cancel');
                  return;
                }
                const fromIndex = e.active?.data.current?.sortable?.index;
                const toIndex = e.over?.data.current?.sortable?.index;
                const from = field.value[fromIndex];
                const to = field.value[toIndex];
                field.move(fromIndex, toIndex);
                onRowDragEnd({ fromIndex, toIndex, from, to });
              }}
            >
              <tbody {...props} />
            </DndContext>
          );
        },
        row: (props) => {
          return <SortableRow {...props}></SortableRow>;
        },
        cell: TdCell,
      },
    };
  }, [field, onRowDragEnd, dragSort]);

  const rowRender = ({ s, index, key }) => {
    const cacheKey = `${index}+${key}`;
    const cached = vnodeCache[cacheKey];
    // 渲染 row,返回对应的 vnode
    const ret = <RecursionField schema={s} name={index} onlyRenderProperties />;
    if (cached && columns.length) {
      return cached;
    } else {
      vnodeCache[cacheKey] = ret;
      return ret;
    }
  };

  const columnSchema = schema.reduceProperties((buf, s) => {
    if (isColumnComponent(s)) {
      return buf.concat([s]);
    }
  }, []);
  const columns = React.useMemo(() => {
    const columns = columnSchema.map((s: Schema) => {
      const collectionFields = s.reduceProperties((buf, s) => {
        if (isCollectionFieldComponent(s)) {
          return buf.concat([s]);
        }
      }, []);
      const dataIndex = collectionFields?.length > 0 ? collectionFields[0].name : s.name;
      return {
        title: <RecursionField name={s.name} schema={s} onlyRenderSelf />,
        dataIndex,
        key: s.name,
        sorter: s['x-component-props']?.['sorter'],
        width: 150,
        shouldCellUpdate: (record, prevRecord) => {
          return record[s.name] !== prevRecord[s.name];
        },
        render: (_, record, index) => rowRender({ s, key: s.name, index }),
      } as TableColumnProps<any>;
    });
    return columns;
  }, [columnFlag, columnSchema.length]);
  const defaultRowKey = (record: any) => {
    return field.value?.indexOf?.(record);
  };

  const getRowKey = (record: any) => {
    if (typeof rowKey === 'string') {
      return record[rowKey]?.toString();
    } else {
      return (rowKey ?? defaultRowKey)(record)?.toString();
    }
  };

  const handleRowChange = useCallback((selectedRowKeys: any[], selectedRows: any[]) => {
    field.data = field.data || {};
    field.data.selectedRowKeys = selectedRowKeys;
    onRowSelectionChange?.(selectedRowKeys, selectedRows);
  }, []);
  const restProps = {
    rowSelection: rowSelection
      ? {
          type: 'checkbox',
          selectedRowKeys: field?.data?.selectedRowKeys || [],
          onChange: handleRowChange,
          renderCell: (checked, record, index, originNode) => {
            if (!dragSort && !showIndex) {
              return originNode;
            }
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
                  {dragSort && <SortHandle id={getRowKey(record)} />}
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
          ...rowSelection,
        }
      : undefined,
  };

  const SortableWrapper = useCallback<React.FC>(
    ({ children }) => {
      return dragSort
        ? React.createElement(SortableContext, {
            items: field.value.map(getRowKey),
            children: children,
          })
        : React.createElement(React.Fragment, {
            children,
          });
    },
    [field, dragSort],
  );

  const handleTableChange = useCallback((pagination, filters, sorter, extra) => {
    onTableChange?.(pagination, filters, sorter, extra);
  }, []);
  return (
    <div
      className={css`
        .ant-table {
          overflow-x: auto;
          overflow-y: hidden;
        }
      `}
    >
      <SortableWrapper>
        <div
          className={css`
            text-align: right;
          `}
        >
          {exists && [render()]}
        </div>
        <AntdTable
          rowKey={rowKey ?? defaultRowKey}
          {...others}
          {...props}
          pagination={paginationProps}
          components={components}
          onChange={handleTableChange}
          // tableLayout={'auto'}
          scroll={{ y: +height }}
          columns={columns}
          dataSource={value.length ? field?.value?.slice?.() : []}
        />
      </SortableWrapper>
      {field.errors.length > 0 && (
        <div className="ant-formily-item-error-help ant-formily-item-help ant-formily-item-help-enter ant-formily-item-help-enter-active">
          {field.errors.map((error) => {
            return error.messages.map((message) => <div>{message}</div>);
          })}
        </div>
      )}
    </div>
  );
});
