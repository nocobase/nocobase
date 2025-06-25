/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CloseOutlined, MenuOutlined } from '@ant-design/icons';
import { TinyColor } from '@ctrl/tinycolor';
import { SortableContext, SortableContextProps, useSortable } from '@dnd-kit/sortable';
import { css, cx } from '@emotion/css';
import { ArrayField } from '@formily/core';
import { spliceArrayState } from '@formily/core/esm/shared/internals';
import { observer, Schema, SchemaOptionsContext, useField, useFieldSchema } from '@formily/react';
import { action } from '@formily/reactive';
import { uid } from '@formily/shared';
import { isPortalInBody } from '@nocobase/utils/client';
import { useDeepCompareEffect, useMemoizedFn } from 'ahooks';
import { Table as AntdTable, TableColumnProps } from 'antd';
import { default as classNames, default as cls } from 'classnames';
import _, { omit } from 'lodash';
import React, {
  createContext,
  FC,
  MutableRefObject,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { DndContext, isBulkEditAction, useDesignable, usePopupSettings, useTableSize } from '../..';
import {
  BlockRequestLoadingContext,
  RecordIndexProvider,
  RecordProvider,
  useAssociationNames,
  useCollection,
  useCollectionParentRecordData,
  useDataBlockProps,
  useDataBlockRequest,
  useDataBlockRequestData,
  useDataBlockRequestGetter,
  useFlag,
  useSchemaInitializerRender,
  useTableSelectorContext,
} from '../../../';
import { useACLFieldWhitelist } from '../../../acl/ACLProvider';
import { useTableBlockContext, useTableBlockContextBasicValue } from '../../../block-provider/TableBlockProvider';
import { isNewRecord } from '../../../data-source/collection-record/isNewRecord';
import {
  NocoBaseRecursionField,
  RefreshComponentProvider,
  useRefreshFieldSchema,
} from '../../../formily/NocoBaseRecursionField';
import { withDynamicSchemaProps } from '../../../hoc/withDynamicSchemaProps';
import { withSkeletonComponent } from '../../../hoc/withSkeletonComponent';
import { LinkageRuleDataKeyMap } from '../../../schema-settings/LinkageRules/type';
import { GetStyleRules } from '../../../schema-settings/LinkageRules/useActionValues';
import { HighPerformanceSpin } from '../../common/high-performance-spin/HighPerformanceSpin';
import { useToken } from '../__builtins__';
import { useAssociationFieldContext } from '../association-field/hooks';
import { TableSkeleton } from './TableSkeleton';
import { extractIndex, isCollectionFieldComponent, isColumnComponent } from './utils';
import { withTooltipComponent } from '../../../hoc/withTooltipComponent';
import { NAMESPACE_UI_SCHEMA } from '../../../i18n/constant';

type BodyRowComponentProps = {
  rowIndex?: number;
  onClick?: (e: any) => void;
  style?: React.CSSProperties;
  className?: string;
  record: any;
  children: React.ReactNode[];
};

interface BodyCellComponentProps {
  columnHidden?: boolean;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  record: any;
  schema: any;
  rowIndex: number;
  isSubTable?: boolean;
}

const useArrayField = (props) => {
  const field = useField<ArrayField>();
  return (props.field || field) as ArrayField;
};

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

const TableCellRender: FC<{
  record: any;
  columnSchema: Schema;
  uiSchema: any;
  filterProperties: (schema: Schema) => boolean;
  schemaToolbarBigger: string;
  field: ArrayField;
  index: number;
}> = ({ record, columnSchema, uiSchema, filterProperties, schemaToolbarBigger, field, index }) => {
  const basePath = field.address.concat(record.__index || index);

  return (
    <span role="button" className={schemaToolbarBigger}>
      <NocoBaseRecursionField
        values={record}
        basePath={basePath}
        schema={columnSchema}
        uiSchema={uiSchema}
        onlyRenderProperties
        propsRecursion
        filterProperties={filterProperties}
        isUseFormilyField={false}
      />
    </span>
  );
};

const useRefreshTableColumns = () => {
  const { params: blockParams, dataSource } = useDataBlockProps() || {};
  const { getDataBlockRequest } = useDataBlockRequestGetter();
  const { getAssociationAppends } = useAssociationNames(dataSource);
  const prevParamsRef = useRef(blockParams);
  const refreshFieldSchema = useRefreshFieldSchema();

  const refresh = useCallback(() => {
    const { appends } = getAssociationAppends();
    const service = getDataBlockRequest();

    if (!_.isEqual(prevParamsRef.current.appends, appends)) {
      prevParamsRef.current = { ...blockParams, appends };
      service.run(prevParamsRef.current);
    }

    refreshFieldSchema?.();
  }, [blockParams, getAssociationAppends, getDataBlockRequest, refreshFieldSchema]);

  return { refresh };
};

const useTableColumns = (
  props: { showDel?: any; isSubTable?: boolean; optimizeTextCellRender: boolean },
  paginationProps,
) => {
  const { t } = useTranslation();
  const { token } = useToken();
  const field = useArrayField(props);
  const schema = useFieldSchema();
  const { schemaInWhitelist } = useACLFieldWhitelist();
  const { designable } = useDesignable();
  const { exists, render } = useSchemaInitializerRender(schema['x-initializer'], schema['x-initializer-props']);
  const columnsSchemas = useMemo(() => {
    return schema.reduceProperties((buf, s) => {
      if (isColumnComponent(s) && schemaInWhitelist(Object.values(s.properties || {}).pop())) {
        return buf.concat([s]);
      }
      return buf;
    }, []);
  }, [schema, schemaInWhitelist]);
  const { current, pageSize } = paginationProps;
  const { isPopupVisibleControlledByURL } = usePopupSettings();
  const { refresh } = useRefreshTableColumns();

  const filterProperties = useCallback(
    (schema) =>
      isBulkEditAction(schema) || !isPopupVisibleControlledByURL() || schema['x-component'] !== 'Action.Container',
    [isPopupVisibleControlledByURL],
  );

  const schemaToolbarBigger = useMemo(() => {
    return css`
      .nb-action-link {
        margin: -${token.paddingContentVerticalLG}px -${token.marginSM}px;
        padding: ${token.paddingContentVerticalLG}px ${token.paddingContentVerticalLG}px ${token.paddingSM}px
          ${token.paddingSM}px;
      }
    `;
  }, [token.paddingContentVerticalLG, token.marginSM, token.margin]);

  const collection = useCollection();

  // 不能提取到外部，否则 NocoBaseRecursionField 的值在一开始会是 undefined。原因未知
  const TableColumnTitle = useMemo(() => withTooltipComponent(NocoBaseRecursionField), []);

  const columns = useMemo(
    () =>
      columnsSchemas?.map((columnSchema: Schema) => {
        const collectionFields = columnSchema.reduceProperties((buf, s) => {
          if (isCollectionFieldComponent(s)) {
            return buf.concat([s]);
          }
        }, []);
        const dataIndex = collectionFields?.length > 0 ? collectionFields[0].name : columnSchema.name;
        const columnHidden = !!columnSchema['x-component-props']?.['columnHidden'];
        const { uiSchema, defaultValue, interface: _interface } = collection?.getField(dataIndex) || {};
        columnSchema.title = t(columnSchema?.title, { ns: NAMESPACE_UI_SCHEMA });
        if (uiSchema) {
          uiSchema.default = defaultValue;
        }
        return {
          title: (
            <RefreshComponentProvider refresh={refresh}>
              <TableColumnTitle
                name={columnSchema.name}
                schema={columnSchema}
                onlyRenderSelf
                isUseFormilyField={false}
                tooltip={columnSchema?.['x-component-props']?.tooltip}
              />
            </RefreshComponentProvider>
          ),
          dataIndex,
          key: columnSchema.name,
          sorter: columnSchema['x-component-props']?.['sorter'],
          columnHidden,
          ...columnSchema['x-component-props'],
          width: columnHidden && !designable ? 0 : columnSchema['x-component-props']?.width || 100,
          render: (value, record, index) => {
            return (
              <RefreshComponentProvider refresh={refresh}>
                <TableCellRender
                  record={record}
                  columnSchema={columnSchema}
                  uiSchema={uiSchema}
                  filterProperties={filterProperties}
                  schemaToolbarBigger={schemaToolbarBigger}
                  field={field}
                  index={index}
                />
              </RefreshComponentProvider>
            );
          },
          onCell: (record, rowIndex) => {
            return {
              record,
              schema: columnSchema,
              rowIndex,
              columnHidden,
            };
          },
          onHeaderCell: () => {
            return {
              columnHidden,
            };
          },
        } as TableColumnProps<any>;
      }),

    [
      columnsSchemas,
      collection,
      refresh,
      designable,
      filterProperties,
      schemaToolbarBigger,
      field,
      props.optimizeTextCellRender,
    ],
  );

  const tableColumns = useMemo(() => {
    if (!exists) {
      return columns;
    }
    const res = [
      ...columns,
      {
        title: <RefreshComponentProvider refresh={refresh}>{render()}</RefreshComponentProvider>,
        dataIndex: 'TABLE_COLUMN_INITIALIZER',
        key: 'TABLE_COLUMN_INITIALIZER',
        render: designable
          ? () => <div style={{ width: '100%', minWidth: '180px' }} className="nb-column-initializer" />
          : null,
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
          if (props.showDel(record)) {
            return (
              <div
                onClick={() => {
                  return action(() => {
                    const fieldIndex = (current - 1) * pageSize + index;
                    const deleteCount = field.value[fieldIndex] ? 1 : 2;
                    spliceArrayState(field, {
                      startIndex: fieldIndex,
                      deleteCount: deleteCount,
                    });
                    field.value.splice(fieldIndex, deleteCount);
                    field.setInitialValue([...field.value]);
                    return field.onInput(field.value);
                  });
                }}
              >
                <CloseOutlined style={{ cursor: 'pointer', color: 'gray' }} />
              </div>
            );
          }
          return;
        },
      });
    }

    return adjustColumnOrder(res);
  }, [columns, exists, field, render, props.showDel, designable]);

  return tableColumns;
};

const SortableRow = (props: BodyRowComponentProps) => {
  const { token } = useToken();
  const id = props['data-row-key']?.toString();
  const { setNodeRef, active, over } = useSortable({
    id,
  });
  const isOver = over?.id == id;
  const { rowIndex, ...others } = props;

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

  const row = (
    <tr
      ref={(node) => {
        if (active?.id !== id) {
          setNodeRef(node);
        }
      }}
      {...others}
      className={classNames(props.className, { [className]: active && isOver })}
    />
  );

  return row;
};

const SortHandle = (props) => {
  const { id, ...otherProps } = props;
  const { listeners, setNodeRef } = useSortable({
    id,
  });
  return <MenuOutlined ref={setNodeRef} {...otherProps} {...listeners} style={{ cursor: 'grab' }} />;
};

const TableIndex = (props) => {
  const { index, ...otherProps } = props;
  return (
    <div className={classNames('nb-table-index')} style={{ padding: '0 8px 0 16px' }} {...otherProps}>
      {index}
    </div>
  );
};

const pageSizeOptions = [5, 10, 20, 50, 100, 200];

const usePaginationProps = (pagination1, pagination2, tableProps) => {
  const { t } = useTranslation();
  const field: any = useField();
  const { token } = useToken();
  const { meta } = useDataBlockRequestData() || {};
  const { hasNext } = meta || {};
  const pagination = useMemo(
    () => ({ ...pagination1, ...pagination2 }),
    [JSON.stringify({ ...pagination1, ...pagination2 })],
  );
  const { total: totalCount, current, pageSize } = pagination || {};
  const blockProps = useDataBlockProps();
  const original = useAssociationFieldContext();
  const { components } = useContext(SchemaOptionsContext);
  const C = original?.fieldSchema?.['x-component-props']?.summary?.Component || blockProps?.summary?.Component;
  const showTotal = useCallback(
    (total) => {
      if (components[C]) {
        return React.createElement(components[C]);
      }
      return t('Total {{count}} items', { count: total });
    },
    [components, C, t],
  );

  const showTotalResult = useMemo(() => {
    return {
      pageSizeOptions,
      showTotal,
      showSizeChanger: true,
      ...pagination,
    };
  }, [pagination, showTotal]);

  const result = useMemo(() => {
    if (totalCount) {
      return showTotalResult;
    } else {
      return {
        pageSizeOptions,
        showTotal: false,
        simple: true,
        showTitle: false,
        showSizeChanger: true,
        hideOnSinglePage: false,
        ...pagination,
        total: tableProps.value?.length < pageSize || !hasNext ? pageSize * current : pageSize * current + 1,
        className: css`
          .ant-pagination-simple-pager {
            display: none !important;
          }
        `,
        itemRender: (_, type, originalElement) => {
          if (type === 'prev') {
            return (
              <div
                style={{ display: 'flex' }}
                className={css`
                  .ant-pagination-item-link {
                    min-width: ${token.controlHeight}px;
                  }
                `}
              >
                {originalElement} <div style={{ marginLeft: '7px' }}>{current}</div>
              </div>
            );
          } else {
            return originalElement;
          }
        },
      };
    }
  }, [pagination, t, showTotal, tableProps.value?.length, showTotalResult]);

  if (pagination2 === false) {
    return false;
  }
  if (!pagination2 && pagination1 === false) {
    return false;
  }
  return tableProps.value?.length > 0 || result.total ? result : false;
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
  .ant-color-picker-trigger {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
  }
`;

const rowSelectCheckboxWrapperClass = css`
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

const HeaderWrapperComponent = React.memo((props) => {
  return (
    <DndContext>
      <thead {...props} />
    </DndContext>
  );
});

// Style when Hidden is enabled in table column configuration
const columnHiddenStyle = {
  borderRight: 'none',
  paddingLeft: 0,
  paddingRight: 0,
};

// Style when Hidden is enabled in configuration mode
const columnOpacityStyle = {
  opacity: 0.3,
};

HeaderWrapperComponent.displayName = 'HeaderWrapperComponent';

const HeaderCellComponent = React.memo(
  (props: { className: string; columnHidden: boolean; children: React.ReactNode }) => {
    const { designable } = useDesignable();

    if (props.columnHidden) {
      return <th style={designable ? columnOpacityStyle : columnHiddenStyle}>{designable ? props.children : null}</th>;
    }

    return <th {..._.omit(props, 'columnHidden')} className={cls(props.className, headerClass)} />;
  },
);

HeaderCellComponent.displayName = 'HeaderCellComponent';

const InternalBodyRowComponent = React.memo((props: BodyRowComponentProps) => {
  const { record, rowIndex } = props;
  const parentRecordData = useCollectionParentRecordData();

  return (
    <RecordProvider isNew={isNewRecord(record)} record={record} parent={parentRecordData}>
      <RecordIndexProvider index={record?.__index || rowIndex}>
        <SortableRow {...props} />
      </RecordIndexProvider>
    </RecordProvider>
  );
});

InternalBodyRowComponent.displayName = 'InternalBodyRowComponent';

const BodyRowComponent = React.memo((props: BodyRowComponentProps) => {
  const prevPropsRef = useRef(props);
  const mountedRef = useRef(false);

  // 1. Initial render
  if (prevPropsRef.current.record === props.record && !mountedRef.current) {
    mountedRef.current = true;
    return <InternalBodyRowComponent {...props} />;
  }

  // 2. On subsequent renders, only re-render when record changes. This improves refresh performance
  if (
    prevPropsRef.current.record !== props.record ||
    prevPropsRef.current.children.length !== props.children.length ||
    prevPropsRef.current.onClick !== props.onClick ||
    !_.isEqual(prevPropsRef.current.style, props.style)
  ) {
    prevPropsRef.current = props;
    return <InternalBodyRowComponent {...props} />;
  }

  // 3. If record hasn't changed, don't re-render
  return <InternalBodyRowComponent {...prevPropsRef.current} />;
});

BodyRowComponent.displayName = 'BodyRowComponent';

const InternalBodyCellComponent = React.memo<BodyCellComponentProps>((props) => {
  const { record, schema, rowIndex, isSubTable, ...others } = props;
  const styleRules = schema?.[LinkageRuleDataKeyMap['style']];
  const [dynamicStyle, setDynamicStyle] = useState({});
  const isReadPrettyMode =
    !!schema?.properties && Object.values(schema.properties).some((item) => item['x-read-pretty'] === true);
  const mergedStyle = useMemo(() => ({ ...props.style, ...dynamicStyle }), [props.style, dynamicStyle]);

  return (
    <>
      {/* To improve rendering performance, do not render GetStyleRules component when no style rules are set */}
      {!_.isEmpty(styleRules) && (
        <GetStyleRules record={record} schema={schema} onStyleChange={isReadPrettyMode ? setDynamicStyle : _.noop} />
      )}
      <td {...others} className={classNames(props.className, cellClass)} style={mergedStyle}>
        {props.children}
      </td>
    </>
  );
});

InternalBodyCellComponent.displayName = 'InternalBodyCellComponent';

const displayNone = { display: 'none' };

const BodyCellComponent = React.memo<BodyCellComponentProps>((props) => {
  const { designable } = useDesignable();

  if (props.columnHidden) {
    return (
      <td style={designable ? columnOpacityStyle : columnHiddenStyle}>
        {designable ? props.children : <span style={displayNone}>{props.children}</span>}
      </td>
    );
  }

  return <InternalBodyCellComponent {..._.omit(props, 'columnHidden')} />;
});

BodyCellComponent.displayName = 'BodyCellComponent';

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
  value?: any[];
  /**
   * If set to true, it will bypass the CollectionField component and render text directly,
   * which provides better rendering performance.
   * @default false
   */
  optimizeTextCellRender?: boolean;
}

export const TableElementRefContext = createContext<MutableRefObject<HTMLDivElement | null> | null>(null);

export const useTableElementRef = () => {
  return useContext(TableElementRefContext);
};

const InternalNocoBaseTable = React.memo(
  (props: {
    tableHeight: number;
    SortableWrapper: React.FC<{}>;
    tableSizeRefCallback: (instance: HTMLDivElement) => void;
    defaultRowKey: (record: any) => any;
    dataSource: any[];
    restProps: { rowSelection: any };
    paginationProps: any;
    components: {
      header: { wrapper: (props: any) => React.JSX.Element; cell: (props: any) => React.JSX.Element };
      body: {
        wrapper: (props: any) => React.JSX.Element;
        row: (props: any) => React.JSX.Element;
        cell: (props: any) => React.JSX.Element;
      };
    };
    onTableChange: any;
    onRow: (record: any) => { onClick: (e: any) => void };
    rowClassName: (record: any) => string;
    scroll: { x: string; y: number };
    columns: any[];
    expandable: { onExpand: (flag: any, record: any) => void; expandedRowKeys: any };
    field: ArrayField<any, any>;
  }): React.ReactElement<any, any> => {
    const {
      tableHeight,
      SortableWrapper,
      tableSizeRefCallback,
      defaultRowKey,
      dataSource,
      paginationProps,
      components,
      onTableChange,
      onRow,
      rowClassName,
      scroll,
      columns,
      expandable,
      field,
      ...others
    } = props;
    const { token } = useToken();
    const tableElementRef = useTableElementRef();

    const refCallback = useCallback(
      (ref) => {
        if (tableElementRef) {
          tableElementRef.current = ref;
        }
        tableSizeRefCallback(ref);
      },
      [tableElementRef, tableSizeRefCallback],
    );

    return (
      <div
        className={cx(
          css`
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
                  .ant-table-expanded-row-fixed {
                    min-height: ${tableHeight}px;
                  }
                  .ant-table-body {
                    min-height: ${tableHeight}px;
                  }
                  .ant-table-cell {
                    padding: 16px 8px;
                  }
                  .ant-table-middle .ant-table-cell {
                    padding: 12px ${token.paddingXS}px;
                  }
                  .ant-table-small .ant-table-cell {
                    padding: 8px ${token.paddingXS}px;
                  }
                  .ant-table-cell-fix-right {
                    padding: 8px 16px !important;
                  }
                }
              }
            }
            .ant-table {
              overflow-x: auto;
              overflow-y: hidden;
            }
          `,
          'nb-table-container',
        )}
      >
        <SortableWrapper>
          <AntdTable
            ref={refCallback}
            rowKey={defaultRowKey}
            // rowKey={(record) => record.id}
            dataSource={dataSource}
            tableLayout="auto"
            {...others}
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
  },
);

InternalNocoBaseTable.displayName = 'InternalNocoBaseTable';

export const Table: any = withDynamicSchemaProps(
  withSkeletonComponent(
    observer((props: TableProps) => {
      const { token } = useToken();
      const { pagination: pagination1, useProps, ...others1 } = omit(props, ['onBlur', 'onFocus']);

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
        value,
        ...others
      } = { ...others1, ...others2 } as any;
      const field = useArrayField(others);
      const schema = useFieldSchema();
      const { size = 'small' } = schema?.['x-component-props'] || {};
      const collection = useCollection();
      const isTableSelector = schema?.parent?.['x-decorator'] === 'TableSelectorProvider';
      const ctx = isTableSelector ? useTableSelectorContext() : useTableBlockContext();
      const { expandFlag, allIncludesChildren, enableIndexColumn } = ctx;
      const onRowDragEnd = useMemoizedFn(others.onRowDragEnd || (() => {}));
      const paginationProps = usePaginationProps(pagination1, pagination2, props);
      const columns = useTableColumns(others, paginationProps);
      const [expandedKeys, setExpandesKeys] = useState(() => (expandFlag ? allIncludesChildren : []));
      const [selectedRowKeys, setSelectedRowKeys] = useState<any[]>(field?.data?.selectedRowKeys || []);
      const [selectedRow, setSelectedRow] = useState([]);
      const isRowSelect = rowSelection?.type !== 'none';
      const defaultRowKeyMap = useRef(new Map());
      const highlightRowCss = useMemo(() => {
        return css`
          & > td {
            background-color: ${token.controlItemBgActive} !important;
          }
          &:hover > td {
            background-color: ${token.controlItemBgActiveHover} !important;
          }
        `;
      }, [token.controlItemBgActive, token.controlItemBgActiveHover]);
      const tableBlockContextBasicValue = useTableBlockContextBasicValue();

      useEffect(() => {
        if (tableBlockContextBasicValue?.field) {
          tableBlockContextBasicValue.field.data = tableBlockContextBasicValue.field?.data || {};

          tableBlockContextBasicValue.field.data.clearSelectedRowKeys = () => {
            tableBlockContextBasicValue.field.data.selectedRowKeys = [];
            setSelectedRowKeys([]);
          };

          tableBlockContextBasicValue.field.data.setSelectedRowKeys = setSelectedRowKeys;
        }
      }, [tableBlockContextBasicValue?.field]);

      const highlightRow = useMemo(() => (onClickRow ? highlightRowCss : ''), [highlightRowCss, onClickRow]);

      const onRow = useMemo(() => {
        if (onClickRow) {
          return (record, rowIndex) => {
            return {
              onClick: (e) => {
                if (isPortalInBody(e.target)) {
                  return;
                }
                onClickRow(record, setSelectedRow, selectedRow);
              },
              rowIndex,
              record,
            };
          };
        }

        return (record, rowIndex) => {
          return {
            rowIndex,
            record,
          };
        };
      }, [onClickRow, selectedRow]);

      useDeepCompareEffect(() => {
        const newExpandesKeys = expandFlag ? allIncludesChildren : [];
        if (!_.isEqual(newExpandesKeys, expandedKeys)) {
          setExpandesKeys(newExpandesKeys);
        }
      }, [expandFlag, allIncludesChildren]);

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
        if (rowKey) {
          return getRowKey(record);
        }
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
          if (Array.isArray(rowKey)) {
            // 使用多个字段值组合生成唯一键
            return rowKey
              .map((keyField) => {
                return record[keyField]?.toString() || '';
              })
              .join('-');
          } else if (typeof rowKey === 'string') {
            return record[rowKey];
          } else {
            // 如果 rowKey 是函数或未提供，使用 defaultRowKey
            return (rowKey ?? defaultRowKey)(record)?.toString();
          }
        },
        [JSON.stringify(rowKey), defaultRowKey],
      );

      const dataSource = useMemo(() => {
        const result = Array.isArray(value) ? value : [];
        return result.filter(Boolean);

        // If we don't depend on "value?.length", it will cause no response when clicking "Add new" in the SubTable
      }, [value, value?.length]);

      const BodyWrapperComponent = useMemo(() => {
        return (props) => {
          const onDragEndCallback = useCallback((e) => {
            if (!e.active || !e.over) {
              console.warn('move cancel');
              return;
            }
            const fromIndex = e.active?.data.current?.sortable?.index;
            const toIndex = e.over?.data.current?.sortable?.index;
            const from = value?.[fromIndex] || e.active;
            const to = value?.[toIndex] || e.over;
            void field.move(fromIndex, toIndex);
            onRowDragEnd({ from, to });
          }, []);

          return (
            <DndContext onDragEnd={onDragEndCallback}>
              <tbody {...props} />
            </DndContext>
          );
        };
      }, [field, onRowDragEnd]); // Don't put 'value' in dependencies, otherwise it will cause the performance issue

      // @ts-ignore
      BodyWrapperComponent.displayName = 'BodyWrapperComponent';

      const components = useMemo(() => {
        return {
          header: {
            wrapper: HeaderWrapperComponent,
            cell: HeaderCellComponent,
          },
          body: {
            wrapper: BodyWrapperComponent,
            row: BodyRowComponent,
            cell: BodyCellComponent,
          },
        };
      }, [BodyWrapperComponent]);

      const memoizedRowSelection = useMemo(() => rowSelection, [JSON.stringify(rowSelection)]);

      const restProps = useMemo(
        () => ({
          rowSelection:
            enableIndexColumn !== false
              ? memoizedRowSelection
                ? {
                    type: 'checkbox',
                    selectedRowKeys: selectedRowKeys,
                    onChange(selectedRowKeys: any[], selectedRows: any[]) {
                      field.data = field.data || {};
                      field.data.selectedRowKeys = selectedRowKeys;
                      field.data.selectedRowData = selectedRows;
                      setSelectedRowKeys(selectedRowKeys);
                      onRowSelectionChange?.(selectedRowKeys, selectedRows, setSelectedRowKeys);
                    },
                    onSelect: (record, selected: boolean, selectedRows, nativeEvent) => {
                      if (tableBlockContextBasicValue) {
                        tableBlockContextBasicValue.field.data = tableBlockContextBasicValue.field?.data || {};
                        tableBlockContextBasicValue.field.data.selectedRecord = record;
                        tableBlockContextBasicValue.field.data.selected = selected;
                      }
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
                      const current = paginationProps?.current;

                      const pageSize = paginationProps?.pageSize || 20;
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
                : undefined
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
          paginationProps,
          tableBlockContextBasicValue,
          enableIndexColumn,
        ],
      );

      const SortableWrapper = useCallback<React.FC>(
        ({ children }) => {
          return dragSort
            ? React.createElement<Omit<SortableContextProps, 'children'>>(
                SortableContext,
                {
                  items: value?.map?.(getRowKey) || [],
                },
                children,
              )
            : React.createElement(React.Fragment, {}, children);
        },
        [dragSort, getRowKey], // Don't put 'value' in dependencies, otherwise it will cause the dropdown component to disappear immediately when adding association fields to the table
      );

      const { height: tableHeight, tableSizeRefCallback } = useTableSize();
      const scroll = useMemo(() => {
        return {
          x: 'max-content',
          y: tableHeight,
        };
      }, [tableHeight, dataSource]);

      const rowClassName = useCallback(
        (record) => (selectedRow.includes(record[rowKey]) ? highlightRow : ''),
        [selectedRow, highlightRow, JSON.stringify(rowKey)],
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
        // If spinning is set to undefined, it will cause the subtable to always display loading, so we need to convert it here.
        // We use Spin here instead of Table's loading prop because using Spin here reduces unnecessary re-renders.
        <HighPerformanceSpin spinning={!!loading}>
          {/**
           * In subsequent component tree, loading context won't be used anymore,
           * so setting a fixed value here improves BlockRequestLoadingContext rendering performance
           */}
          <BlockRequestLoadingContext.Provider value={false}>
            <InternalNocoBaseTable
              tableHeight={tableHeight}
              SortableWrapper={SortableWrapper}
              tableSizeRefCallback={tableSizeRefCallback}
              defaultRowKey={defaultRowKey}
              dataSource={dataSource}
              {...others}
              {...restProps}
              paginationProps={paginationProps}
              components={components}
              onTableChange={onTableChange}
              onRow={onRow}
              rowClassName={rowClassName}
              scroll={scroll}
              columns={columns}
              expandable={expandable}
              field={field}
              size={size}
            />
          </BlockRequestLoadingContext.Provider>
        </HighPerformanceSpin>
      );
    }),
    {
      useLoading() {
        const service = useDataBlockRequest();
        const { isInSubTable } = useFlag();

        if (isInSubTable) {
          return false;
        }
        return !!service?.loading;
      },
      SkeletonComponent: TableSkeleton,
    },
  ),
  { displayName: 'NocoBaseTable' },
);
