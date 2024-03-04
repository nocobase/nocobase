import { DeleteOutlined, MenuOutlined } from '@ant-design/icons';
import { TinyColor } from '@ctrl/tinycolor';
import { SortableContext, SortableContextProps, useSortable } from '@dnd-kit/sortable';
import { css } from '@emotion/css';
import { ArrayField } from '@formily/core';
import { spliceArrayState } from '@formily/core/esm/shared/internals';
import { RecursionField, Schema, observer, useField, useFieldSchema } from '@formily/react';
import { action } from '@formily/reactive';
import { uid } from '@formily/shared';
import { isPortalInBody } from '@nocobase/utils/client';
import { useMemoizedFn } from 'ahooks';
import { Table as AntdTable, TableColumnProps } from 'antd';
import { default as classNames, default as cls } from 'classnames';
import _ from 'lodash';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DndContext, useDesignable, useTableSize } from '../..';
import {
  RecordIndexProvider,
  RecordProvider,
  useCollection_deprecated,
  useCollectionParentRecordData,
  useSchemaInitializerRender,
  useTableBlockContext,
  useTableSelectorContext,
} from '../../../';
import { useACLFieldWhitelist } from '../../../acl/ACLProvider';
import { useToken } from '../__builtins__';
import { SubFormProvider } from '../association-field/hooks';
import { ColumnFieldProvider } from './components/ColumnFieldProvider';
import { extractIndex, isCollectionFieldComponent, isColumnComponent } from './utils';
import { isNewRecord } from '../../../data-source/collection-record/isNewRecord';

const useArrayField = (props) => {
  const field = useField<ArrayField>();
  return (props.field || field) as ArrayField;
};

const useTableColumns = (props: { showDel?: boolean; isSubTable?: boolean }) => {
  const { token } = useToken();
  const field = useArrayField(props);
  const schema = useFieldSchema();
  const { schemaInWhitelist } = useACLFieldWhitelist();
  const { designable } = useDesignable();
  const { exists, render } = useSchemaInitializerRender(schema['x-initializer'], schema['x-initializer-props']);
  const parentRecordData = useCollectionParentRecordData();
  const columns = schema
    .reduceProperties((buf, s) => {
      if (isColumnComponent(s) && schemaInWhitelist(Object.values(s.properties || {}).pop())) {
        return buf.concat([s]);
      }
      return buf;
    }, [])
    ?.map((s: Schema) => {
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
        width: 200,
        ...s['x-component-props'],
        render: (v, record) => {
          const index = field.value?.indexOf(record);
          return (
            <SubFormProvider value={record}>
              <RecordIndexProvider index={record.__index || index}>
                <RecordProvider isNew={isNewRecord(record)} record={record} parent={parentRecordData}>
                  <ColumnFieldProvider schema={s} basePath={field.address.concat(record.__index || index)}>
                    <span
                      role="button"
                      className={css`
                        // 扩大 SchemaToolbar 的面积
                        .nb-action-link {
                          margin: -${token.paddingContentVerticalLG}px -${token.marginSM}px;
                          padding: ${token.paddingContentVerticalLG}px ${token.marginSM}px;
                        }
                      `}
                    >
                      <RecursionField
                        basePath={field.address.concat(record.__index || index)}
                        schema={s}
                        onlyRenderProperties
                      />
                    </span>
                  </ColumnFieldProvider>
                </RecordProvider>
              </RecordIndexProvider>
            </SubFormProvider>
          );
        },
      } as TableColumnProps<any>;
    });
  if (!exists) {
    return columns;
  }

  const tableColumns = columns.concat({
    title: render(),
    dataIndex: 'TABLE_COLUMN_INITIALIZER',
    key: 'TABLE_COLUMN_INITIALIZER',
    render: designable ? () => <div style={{ minWidth: 300 }} /> : null,
  });

  if (props.showDel) {
    tableColumns.push({
      title: '',
      key: 'delete',
      width: 60,
      align: 'center',
      fixed: 'right',
      render: (v, record, index) => {
        return (
          <DeleteOutlined
            style={{ cursor: 'pointer' }}
            onClick={() => {
              action(() => {
                spliceArrayState(field as any, {
                  startIndex: index,
                  deleteCount: 1,
                });
                field.value.splice(index, 1);
                field.initialValue?.splice(index, 1);
                return field.onInput(field.value);
              });
            }}
          />
        );
      },
    });
  }
  return tableColumns;
};

const SortableRow = (props) => {
  const { token } = useToken();
  const id = props['data-row-key']?.toString();
  const { setNodeRef, isOver, active, over } = useSortable({
    id,
  });

  const classObj = useMemo(() => {
    const borderColor = new TinyColor(token.colorSettings).setAlpha(0.6).toHex8String();
    return {
      topActiveClass: css`
        & > td {
          border-top: 2px solid ${borderColor} !important;
        }
      `,
      bottomActiveClass: css`
        & > td {
          border-bottom: 2px solid ${borderColor} !important;
        }
      `,
    };
  }, [token.colorSettings]);

  const className =
    (active?.data.current?.sortable.index ?? -1) > (over?.data.current?.sortable?.index ?? -1)
      ? classObj.topActiveClass
      : classObj.bottomActiveClass;

  return (
    <tr
      ref={active?.id !== id ? setNodeRef : null}
      {...props}
      className={classNames(props.className, { [className]: active && isOver })}
    />
  );
};

const SortHandle = (props) => {
  const { id, ...otherProps } = props;
  const { listeners } = useSortable({
    id,
  });
  return <MenuOutlined {...otherProps} {...listeners} style={{ cursor: 'grab' }} />;
};

const TableIndex = (props) => {
  const { index, ...otherProps } = props;
  return (
    <div className={classNames('nb-table-index')} style={{ padding: '0 8px 0 16px' }} {...otherProps}>
      {index}
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
  const result = {
    showTotal: (total) => t('Total {{count}} items', { count: total }),
    showSizeChanger: true,
    ...pagination1,
    ...pagination2,
  };
  return result.total <= result.pageSize ? false : result;
};

export const Table: any = observer(
  (props: {
    useProps?: () => any;
    onChange?: (pagination, filters, sorter, extra) => void;
    onRowSelectionChange?: (selectedRowKeys: any[], selectedRows: any[]) => void;
    onRowDragEnd?: (e: { from: any; to: any }) => void;
    onClickRow?: (record: any, setSelectedRow: (selectedRow: any[]) => void, selectedRow: any[]) => void;
    pagination?: any;
    showIndex?: boolean;
    dragSort?: boolean;
    rowKey?: string | ((record: any) => string);
    rowSelection?: any;
    required?: boolean;
    onExpand?: (flag: boolean, record: any) => void;
    isSubTable?: boolean;
  }) => {
    const { token } = useToken();
    const { pagination: pagination1, useProps, onChange, ...others1 } = props;
    const { pagination: pagination2, onClickRow, ...others2 } = useProps?.() || {};
    const {
      dragSort = false,
      showIndex = true,
      onRowSelectionChange,
      onChange: onTableChange,
      rowSelection,
      rowKey,
      required,
      onExpand,
      ...others
    } = { ...others1, ...others2 } as any;
    const field = useArrayField(others);
    const columns = useTableColumns(others);
    const schema = useFieldSchema();
    const collection = useCollection_deprecated();
    const isTableSelector = schema?.parent?.['x-decorator'] === 'TableSelectorProvider';
    const ctx = isTableSelector ? useTableSelectorContext() : useTableBlockContext();
    const { expandFlag, allIncludesChildren } = ctx;
    const onRowDragEnd = useMemoizedFn(others.onRowDragEnd || (() => {}));
    const paginationProps = usePaginationProps(pagination1, pagination2);
    const [expandedKeys, setExpandesKeys] = useState([]);
    const [selectedRowKeys, setSelectedRowKeys] = useState<any[]>(field?.data?.selectedRowKeys || []);
    const [selectedRow, setSelectedRow] = useState([]);
    const dataSource = field?.value?.slice?.()?.filter?.(Boolean) || [];
    const isRowSelect = rowSelection?.type !== 'none';
    const defaultRowKeyMap = useRef(new Map());
    let onRow = null,
      highlightRow = '';

    if (onClickRow) {
      onRow = (record) => {
        return {
          onClick: (e) => {
            if (isPortalInBody(e.target)) {
              return;
            }
            onClickRow(record, setSelectedRow, selectedRow);
          },
        };
      };
      highlightRow = css`
        & > td {
          background-color: ${token.controlItemBgActiveHover} !important;
        }
        &:hover > td {
          background-color: ${token.controlItemBgActiveHover} !important;
        }
      `;
    }

    useEffect(() => {
      if (expandFlag) {
        setExpandesKeys(allIncludesChildren);
      } else {
        setExpandesKeys([]);
      }
    }, [expandFlag, allIncludesChildren]);

    const components = useMemo(() => {
      return {
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
                  const from = field.value[fromIndex] || e.active;
                  const to = field.value[toIndex] || e.over;
                  void field.move(fromIndex, toIndex);
                  onRowDragEnd({ from, to });
                }}
              >
                <tbody {...props} />
              </DndContext>
            );
          },
          row: (props) => {
            return <SortableRow {...props}></SortableRow>;
          },
          cell: (props) => (
            <td
              {...props}
              className={classNames(
                props.className,
                css`
                  max-width: 300px;
                  white-space: nowrap;
                  .nb-read-pretty-input-number {
                    text-align: right;
                  }
                  .ant-color-picker-trigger {
                    position: absolute;
                    top: 50%;
                    transform: translateY(-50%);
                  }
                `,
              )}
            />
          ),
        },
      };
    }, [field, onRowDragEnd, dragSort]);

    /**
     * 为没有设置 key 属性的表格行生成一个唯一的 key
     * 1. rowKey 的默认值是 “key”，所以先判断有没有 record.key；
     * 2. 如果没有就生成一个唯一的 key，并以 record 的值作为索引；
     * 3. 这样下次就能取到对应的 key 的值；
     *
     * 这里有效的前提是：数组中对应的 record 的引用不会发生改变。
     *
     * @param record
     * @returns
     */
    const defaultRowKey = (record: any) => {
      if (record.key) {
        return record.key;
      }

      if (defaultRowKeyMap.current.has(record)) {
        return defaultRowKeyMap.current.get(record);
      }

      const key = uid();
      defaultRowKeyMap.current.set(record, key);
      return key;
    };

    const getRowKey = (record: any) => {
      if (typeof rowKey === 'string') {
        return record[rowKey]?.toString();
      } else {
        return (rowKey ?? defaultRowKey)(record)?.toString();
      }
    };

    const restProps = {
      rowSelection: rowSelection
        ? {
            type: 'checkbox',
            selectedRowKeys: selectedRowKeys,
            onChange(selectedRowKeys: any[], selectedRows: any[]) {
              field.data = field.data || {};
              field.data.selectedRowKeys = selectedRowKeys;
              setSelectedRowKeys(selectedRowKeys);
              onRowSelectionChange?.(selectedRowKeys, selectedRows);
            },
            getCheckboxProps(record) {
              return {
                'aria-label': `checkbox`,
              };
            },
            renderCell: (checked, record, index, originNode) => {
              if (!dragSort && !showIndex) {
                return originNode;
              }
              const current = props?.pagination?.current;
              const pageSize = props?.pagination?.pageSize || 20;
              if (current) {
                index = index + (current - 1) * pageSize + 1;
              } else {
                index = index + 1;
              }
              if (record.__index) {
                index = extractIndex(record.__index);
              }
              return (
                <div
                  role="button"
                  aria-label={`table-index-${index}`}
                  className={classNames(
                    checked ? 'checked' : null,
                    css`
                      position: relative;
                      display: flex;
                      float: left;
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
                    `,
                    {
                      [css`
                        &:hover {
                          .nb-table-index {
                            opacity: 0;
                          }
                          .nb-origin-node {
                            display: block;
                          }
                        }
                      `]: isRowSelect,
                    },
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
                  {isRowSelect && (
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
                  )}
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
          ? React.createElement<Omit<SortableContextProps, 'children'>>(
              SortableContext,
              {
                items: field.value?.map?.(getRowKey) || [],
              },
              children,
            )
          : React.createElement(React.Fragment, {}, children);
      },
      [field, dragSort],
    );
    const fieldSchema = useFieldSchema();
    const fixedBlock = fieldSchema?.parent?.['x-decorator-props']?.fixedBlock;

    const { height: tableHeight, tableSizeRefCallback } = useTableSize();
    const scroll = useMemo(() => {
      return fixedBlock
        ? {
            x: 'max-content',
            y: tableHeight,
          }
        : {
            x: 'max-content',
          };
    }, [fixedBlock, tableHeight]);
    return (
      <div
        className={css`
          height: 100%;
          overflow: hidden;
          .ant-table-wrapper {
            height: 100%;
            .ant-spin-nested-loading {
              height: 100%;
              .ant-spin-container {
                height: 100%;
                display: flex;
                flex-direction: column;
              }
            }
          }
          .ant-table {
            overflow-x: auto;
            overflow-y: hidden;
          }
        `}
      >
        <SortableWrapper>
          <AntdTable
            ref={tableSizeRefCallback}
            rowKey={rowKey ?? defaultRowKey}
            dataSource={dataSource}
            tableLayout="auto"
            {...others}
            {...restProps}
            pagination={paginationProps}
            components={components}
            onChange={(pagination, filters, sorter, extra) => {
              onTableChange?.(pagination, filters, sorter, extra);
            }}
            onRow={onRow}
            rowClassName={(record) => (selectedRow.includes(record[rowKey]) ? highlightRow : '')}
            scroll={scroll}
            columns={columns}
            expandable={{
              onExpand: (flag, record) => {
                const newKeys = flag
                  ? [...expandedKeys, record[collection.getPrimaryKey()]]
                  : expandedKeys.filter((i) => record[collection.getPrimaryKey()] !== i);
                setExpandesKeys(newKeys);
                onExpand?.(flag, record);
              },
              expandedRowKeys: expandedKeys,
            }}
          />
        </SortableWrapper>
        {field.errors.length > 0 && (
          <div className="ant-formily-item-error-help ant-formily-item-help ant-formily-item-help-enter ant-formily-item-help-enter-active">
            {field.errors.map((error) => {
              return error.messages.map((message) => <div key={message}>{message}</div>);
            })}
          </div>
        )}
      </div>
    );
  },
  { displayName: 'Table' },
);
