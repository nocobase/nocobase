/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

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
import { useCreation, useDeepCompareEffect, useMemoizedFn } from 'ahooks';
import { Table as AntdTable, Skeleton, TableColumnProps } from 'antd';
import { default as classNames, default as cls } from 'classnames';
import _, { omit } from 'lodash';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useInView } from 'react-intersection-observer';
import { DndContext, useDesignable, useTableSize } from '../..';
import {
  RecordIndexProvider,
  RecordProvider,
  useCollection,
  useCollectionParentRecordData,
  useSchemaInitializerRender,
  useTableBlockContext,
  useTableSelectorContext,
} from '../../../';
import { useACLFieldWhitelist } from '../../../acl/ACLProvider';
import { isNewRecord } from '../../../data-source/collection-record/isNewRecord';
import { withDynamicSchemaProps } from '../../../hoc/withDynamicSchemaProps';
import { useToken } from '../__builtins__';
import { SubFormProvider } from '../association-field/hooks';
import { ColumnFieldProvider } from './components/ColumnFieldProvider';
import { extractIndex, isCollectionFieldComponent, isColumnComponent } from './utils';

const MemoizedAntdTable = React.memo(AntdTable);

const useArrayField = (props) => {
  const field = useField<ArrayField>();
  return (props.field || field) as ArrayField;
};

function getSchemaArrJSON(schemaArr: Schema[]) {
  return schemaArr.map((item) => (item.name === 'actions' ? omit(item.toJSON(), 'properties') : item.toJSON()));
}
function adjustColumnOrder(columns) {
  const leftFixedColumns = [];
  const normalColumns = [];
  const rightFixedColumns = [];

  columns.forEach((column) => {
    if (column.fixed === 'left') {
      leftFixedColumns.push(column);
    } else if (column.fixed === 'right') {
      rightFixedColumns.push(column);
    } else {
      normalColumns.push(column);
    }
  });

  return [...leftFixedColumns, ...normalColumns, ...rightFixedColumns];
}

export const useColumnsDeepMemoized = (columns: any[]) => {
  const columnsJSON = getSchemaArrJSON(columns);
  const oldObj = useCreation(() => ({ value: _.cloneDeep(columnsJSON) }), []);

  if (!_.isEqual(columnsJSON, oldObj.value)) {
    oldObj.value = _.cloneDeep(columnsJSON);
  }

  return oldObj.value;
};

const useTableColumns = (props: { showDel?: boolean; isSubTable?: boolean }) => {
  const { token } = useToken();
  const field = useArrayField(props);
  const schema = useFieldSchema();
  const { schemaInWhitelist } = useACLFieldWhitelist();
  const { designable } = useDesignable();
  const { exists, render } = useSchemaInitializerRender(schema['x-initializer'], schema['x-initializer-props']);
  const parentRecordData = useCollectionParentRecordData();
  const columnsSchema = schema.reduceProperties((buf, s) => {
    if (isColumnComponent(s) && schemaInWhitelist(Object.values(s.properties || {}).pop())) {
      return buf.concat([s]);
    }
    return buf;
  }, []);

  // const hasChangedColumns = useColumnsDeepMemoized(columnsSchema);

  const schemaToolbarBigger = useMemo(() => {
    return css`
      .nb-action-link {
        margin: -${token.paddingContentVerticalLG}px -${token.marginSM}px;
        padding: ${token.paddingContentVerticalLG}px ${token.margin}px;
      }
    `;
  }, [token.paddingContentVerticalLG, token.marginSM]);

  const collection = useCollection();

  const columns = useMemo(
    () =>
      columnsSchema?.map((s: Schema) => {
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
            // 这行代码会导致这里的测试不通过：packages/core/client/src/modules/blocks/data-blocks/table/__e2e__/schemaInitializer.test.ts:189
            // if (collectionFields?.length === 1 && collectionFields[0]['x-read-pretty'] && v == undefined) return null;

            const index = field.value?.indexOf(record);
            const basePath = field.address.concat(record.__index || index);
            return (
              <SubFormProvider value={{ value: record, collection }}>
                <RecordIndexProvider index={record.__index || index}>
                  <RecordProvider isNew={isNewRecord(record)} record={record} parent={parentRecordData}>
                    <ColumnFieldProvider schema={s} basePath={basePath}>
                      <span role="button" className={schemaToolbarBigger}>
                        <RecursionField basePath={basePath} schema={s} onlyRenderProperties />
                      </span>
                    </ColumnFieldProvider>
                  </RecordProvider>
                </RecordIndexProvider>
              </SubFormProvider>
            );
          },
        } as TableColumnProps<any>;

        // 这里不能把 columnsSchema 作为依赖，因为其每次都会变化，这里使用 hasChangedColumns 作为依赖
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }),
    [columnsSchema, field.value, field.address, collection, parentRecordData, schemaToolbarBigger],
  );

  const tableColumns = useMemo(() => {
    if (!exists) {
      return columns;
    }
    const res = [
      ...columns,
      {
        title: render(),
        dataIndex: 'TABLE_COLUMN_INITIALIZER',
        key: 'TABLE_COLUMN_INITIALIZER',
        render: designable ? () => <div style={{ minWidth: 180 }} /> : null,
        fixed: designable ? 'right' : 'none',
      },
    ];

    if (props.showDel) {
      res.push({
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

    return adjustColumnOrder(res);
  }, [columns, exists, field, render, props.showDel, designable]);

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
  const pagination = useMemo(
    () => ({ ...pagination1, ...pagination2 }),
    [JSON.stringify({ ...pagination1, ...pagination2 })],
  );

  const showTotal = useCallback((total) => t('Total {{count}} items', { count: total }), [t]);

  const result = useMemo(
    () => ({
      showTotal,
      showSizeChanger: true,
      ...pagination,
    }),
    [pagination, t, showTotal],
  );

  if (pagination2 === false) {
    return false;
  }
  if (!pagination2 && pagination1 === false) {
    return false;
  }

  return result.total <= result.pageSize ? false : result;
};

const headerClass = css`
  max-width: 300px;
  white-space: nowrap;
  &:hover .general-schema-designer {
    display: block;
  }
`;

const cellClass = css`
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
`;

const rowSelectCheckboxWrapperClass = css`
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
`;

const rowSelectCheckboxWrapperClassHover = css`
  &:hover {
    .nb-table-index {
      opacity: 0;
    }
    .nb-origin-node {
      display: block;
    }
  }
`;

const rowSelectCheckboxContentClass = css`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-evenly;
`;

const rowSelectCheckboxCheckedClassHover = css`
  position: absolute;
  right: 50%;
  transform: translateX(50%);
  &:not(.checked) {
    display: none;
  }
`;

const HeaderWrapperComponent = (props) => {
  return (
    <DndContext>
      <thead {...props} />
    </DndContext>
  );
};

const HeaderCellComponent = (props) => {
  return <th {...props} className={cls(props.className, headerClass)} />;
};

const BodyRowComponent = (props) => {
  return <SortableRow {...props} />;
};

interface TableProps {
  /** @deprecated */
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
}

export const Table: any = withDynamicSchemaProps(
  observer((props: TableProps) => {
    const { token } = useToken();
    const { pagination: pagination1, useProps, ...others1 } = omit(props, ['onBlur', 'onFocus', 'value']);

    // 新版 UISchema（1.0 之后）中已经废弃了 useProps，这里之所以继续保留是为了兼容旧版的 UISchema
    const { pagination: pagination2, ...others2 } = useProps?.() || {};

    const {
      dragSort = false,
      showIndex = true,
      onRowSelectionChange,
      onChange: onTableChange,
      rowSelection,
      rowKey,
      required,
      onExpand,
      loading,
      onClickRow,
      ...others
    } = { ...others1, ...others2 } as any;
    const field = useArrayField(others);
    const columns = useTableColumns(others);
    const schema = useFieldSchema();
    const collection = useCollection();
    const isTableSelector = schema?.parent?.['x-decorator'] === 'TableSelectorProvider';
    const ctx = isTableSelector ? useTableSelectorContext() : useTableBlockContext();
    const { expandFlag, allIncludesChildren } = ctx;
    const onRowDragEnd = useMemoizedFn(others.onRowDragEnd || (() => {}));
    const paginationProps = usePaginationProps(pagination1, pagination2);
    const [expandedKeys, setExpandesKeys] = useState(() => (expandFlag ? allIncludesChildren : []));
    const [selectedRowKeys, setSelectedRowKeys] = useState<any[]>(field?.data?.selectedRowKeys || []);
    const [selectedRow, setSelectedRow] = useState([]);
    const isRowSelect = rowSelection?.type !== 'none';
    const defaultRowKeyMap = useRef(new Map());

    const highlightRowCss = useMemo(() => {
      return css`
        & > td {
          background-color: ${token.controlItemBgActiveHover} !important;
        }
        &:hover > td {
          background-color: ${token.controlItemBgActiveHover} !important;
        }
      `;
    }, [token.controlItemBgActiveHover]);

    const highlightRow = useMemo(
      () => (onClickRow ? highlightRowCss : ''),
      [onClickRow, token.controlItemBgActiveHover],
    );

    const onRow = useMemo(() => {
      if (onClickRow) {
        return (record) => {
          return {
            onClick: (e) => {
              if (isPortalInBody(e.target)) {
                return;
              }
              onClickRow(record, setSelectedRow, selectedRow);
            },
          };
        };
      }
      return null;
    }, [onClickRow, selectedRow]);

    useDeepCompareEffect(() => {
      const newExpandesKeys = expandFlag ? allIncludesChildren : [];
      if (!_.isEqual(newExpandesKeys, expandedKeys)) {
        setExpandesKeys(newExpandesKeys);
      }
    }, [expandFlag]);

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
    const defaultRowKey = useCallback((record: any) => {
      if (record.key) {
        return record.key;
      }

      if (defaultRowKeyMap.current.has(record)) {
        return defaultRowKeyMap.current.get(record);
      }

      const key = uid();
      defaultRowKeyMap.current.set(record, key);
      return key;
    }, []);

    const getRowKey = useCallback(
      (record: any) => {
        if (typeof rowKey === 'string') {
          return record[rowKey]?.toString();
        } else {
          return (rowKey ?? defaultRowKey)(record)?.toString();
        }
      },
      [rowKey, defaultRowKey],
    );

    const dataSourceKeys = field?.value?.map(getRowKey);
    const memoizedDataSourceKeys = useMemo(() => dataSourceKeys, [JSON.stringify(dataSourceKeys)]);
    const dataSource = useMemo(
      () => [...(field?.value || [])].filter(Boolean),
      [field?.value, field?.value?.length, memoizedDataSourceKeys],
    );

    const bodyWrapperComponent = useMemo(() => {
      return (props) => {
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
      };
    }, [onRowDragEnd, field]);

    const BodyCellComponent = useCallback(
      (props) => {
        const isIndex = props.className?.includes('selection-column');

        const { ref, inView } = useInView({
          threshold: 0,
          triggerOnce: true,
          initialInView: isIndex || !!process.env.__E2E__ || dataSource.length <= 10,
          skip: isIndex || !!process.env.__E2E__,
        });

        return (
          <td {...props} ref={ref} className={classNames(props.className, cellClass)}>
            {inView || isIndex ? props.children : <Skeleton.Button style={{ height: '100%' }} />}
          </td>
        );
      },
      [dataSource.length],
    );

    const components = useMemo(() => {
      return {
        header: {
          wrapper: HeaderWrapperComponent,
          cell: HeaderCellComponent,
        },
        body: {
          wrapper: bodyWrapperComponent,
          row: BodyRowComponent,
          cell: BodyCellComponent,
        },
      };
    }, [BodyCellComponent, bodyWrapperComponent]);

    const memoizedRowSelection = useMemo(() => rowSelection, [JSON.stringify(rowSelection)]);

    const restProps = useMemo(
      () => ({
        rowSelection: memoizedRowSelection
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
                    className={classNames(checked ? 'checked' : null, rowSelectCheckboxWrapperClass, {
                      [rowSelectCheckboxWrapperClassHover]: isRowSelect,
                    })}
                  >
                    <div className={classNames(checked ? 'checked' : null, rowSelectCheckboxContentClass)}>
                      {dragSort && <SortHandle id={getRowKey(record)} />}
                      {showIndex && <TableIndex index={index} />}
                    </div>
                    {isRowSelect && (
                      <div
                        className={classNames(
                          'nb-origin-node',
                          checked ? 'checked' : null,
                          rowSelectCheckboxCheckedClassHover,
                        )}
                      >
                        {originNode}
                      </div>
                    )}
                  </div>
                );
              },
              ...memoizedRowSelection,
            }
          : undefined,
      }),
      [
        memoizedRowSelection,
        selectedRowKeys,
        onRowSelectionChange,
        showIndex,
        dragSort,
        field,
        getRowKey,
        isRowSelect,
        memoizedRowSelection,
      ],
    );

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
      [field, dragSort, getRowKey],
    );
    const fieldSchema = useFieldSchema();
    const fixedBlock = fieldSchema?.parent?.['x-decorator-props']?.fixedBlock;

    const { height: tableHeight, tableSizeRefCallback } = useTableSize(fixedBlock);
    const maxContent = useMemo(() => {
      return {
        x: 'max-content',
      };
    }, []);
    const scroll = useMemo(() => {
      return fixedBlock
        ? {
            x: 'max-content',
            y: tableHeight,
          }
        : maxContent;
    }, [fixedBlock, tableHeight, maxContent]);

    const rowClassName = useCallback(
      (record) => (selectedRow.includes(record[rowKey]) ? highlightRow : ''),
      [selectedRow, highlightRow, rowKey],
    );

    const onExpandValue = useCallback(
      (flag, record) => {
        const newKeys = flag
          ? [...expandedKeys, record[collection.getPrimaryKey()]]
          : expandedKeys.filter((i) => record[collection.getPrimaryKey()] !== i);
        setExpandesKeys(newKeys);
        onExpand?.(flag, record);
      },
      [expandedKeys, onExpand, collection],
    );

    const expandable = useMemo(() => {
      return {
        onExpand: onExpandValue,
        expandedRowKeys: expandedKeys,
      };
    }, [expandedKeys, onExpandValue]);

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
          <MemoizedAntdTable
            ref={tableSizeRefCallback}
            rowKey={rowKey ?? defaultRowKey}
            dataSource={dataSource}
            tableLayout="auto"
            {...others}
            {...restProps}
            loading={loading}
            pagination={paginationProps}
            components={components}
            onChange={onTableChange}
            onRow={onRow}
            rowClassName={rowClassName}
            scroll={scroll}
            columns={columns}
            expandable={expandable}
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
  }),
  { displayName: 'NocoBaseTable' },
);
