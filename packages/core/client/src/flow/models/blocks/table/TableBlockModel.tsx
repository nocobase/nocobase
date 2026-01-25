/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { EditOutlined, SettingOutlined } from '@ant-design/icons';
import { DragEndEvent } from '@dnd-kit/core';
import { css } from '@emotion/css';
import {
  AddSubModelButton,
  autorun,
  createCurrentRecordMetaFactory,
  DndProvider,
  DragHandler,
  Droppable,
  tExpr,
  FlowModelRenderer,
  FlowSettingsButton,
  ForkFlowModel,
  MultiRecordResource,
  observable,
  useFlowContext,
  useFlowEngine,
  observer,
} from '@nocobase/flow-engine';
import { Skeleton, Space, Table } from 'antd';
import classNames from 'classnames';
import _ from 'lodash';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActionModel, BlockSceneEnum, CollectionBlockModel } from '../../base';
import { QuickEditFormModel } from '../form/QuickEditFormModel';
import { TableColumnModel } from './TableColumnModel';
import { extractIndex, adjustColumnOrder, setNestedValue, extractIds, getRowKey } from './utils';
import { commonConditionHandler, ConditionBuilder } from '../../../components/ConditionBuilder';
import { HighPerformanceSpin } from '../../../../schema-component/common/high-performance-spin/HighPerformanceSpin';

const MemoizedTable = React.memo(Table);

type TableBlockModelStructure = {
  subModels: {
    columns: TableColumnModel[];
    actions: ActionModel[];
  };
};

const TableIndex = (props) => {
  const { index, ...otherProps } = props;
  return (
    <div className={classNames('nb-table-index')} style={{ padding: '0 8px 0 16px' }} {...otherProps}>
      {index}
    </div>
  );
};

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

const highlightedRowClass = css`
  & td {
    background-color: #e6f7ff !important;
  }

  &:hover td {
    background-color: #bae7ff !important;
  }
`;
const HeaderWrapperComponent = React.memo((props) => {
  const engine = useFlowEngine();

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (active.id && over?.id && active.id !== over.id) {
      engine.moveModel(active.id as string, over.id as string);
    }
  };

  return (
    <DndProvider onDragEnd={onDragEnd}>
      <thead {...props} />
    </DndProvider>
  );
});

const AddFieldColumn = ({ model }: { model: TableBlockModel }) => {
  return (
    <AddSubModelButton
      model={model}
      subModelKey={'columns'}
      key={'table-add-columns'}
      subModelBaseClasses={[
        model.getModelClassName('TableColumnModel'),
        model.getModelClassName('TableAssociationFieldGroupModel'),
        model.getModelClassName('TableCustomColumnModel'),
      ].filter(Boolean)}
      keepDropdownOpen
    >
      <FlowSettingsButton icon={<SettingOutlined />}>{model.translate('Fields')}</FlowSettingsButton>
    </AddSubModelButton>
  );
};

type CustomTableBlockModelClassesEnum = {
  CollectionActionGroupModel?: string;
  RecordActionGroupModel?: string;
  TableColumnModel?: string;
  TableAssociationFieldGroupModel?: string;
  TableCustomColumnModel?: string;
};

export class TableBlockModel extends CollectionBlockModel<TableBlockModelStructure> {
  static scene = BlockSceneEnum.many;

  rowSelectionProps = observable.deep({});

  _defaultCustomModelClasses = {
    CollectionActionGroupModel: 'CollectionActionGroupModel',
    RecordActionGroupModel: 'RecordActionGroupModel',
    TableColumnModel: 'TableColumnModel',
    TableAssociationFieldGroupModel: 'TableAssociationFieldGroupModel',
    TableCustomColumnModel: 'TableCustomColumnModel',
  };

  customModelClasses: CustomTableBlockModelClassesEnum = {};

  get resource() {
    return super.resource as MultiRecordResource;
  }

  private readonly columns = observable.ref([]);
  private disposeAutorun: () => void;

  onMount() {
    super.onMount();
    // 只有当表格列发生变化时才重新计算 columns，防止表格出现不必要的重渲染
    this.disposeAutorun = autorun(() => {
      this.columns.value = this.getColumns();
    });
  }

  onUnmount() {
    super.onUnmount();
    if (this.disposeAutorun) {
      this.disposeAutorun();
    }
  }

  createResource(ctx, params) {
    return this.context.createResource(MultiRecordResource);
  }

  /**
   * 高亮指定的行
   * @param record - 要高亮的行记录
   */
  highlightRow(record: any) {
    if (record) {
      this.setProps('highlightedRowKey', getRowKey(record, this.collection.filterTargetKey));
    }
  }

  /**
   * 取消行高亮
   */
  clearHighlight() {
    this.setProps('highlightedRowKey', null);
  }

  getColumns() {
    const cols = this.mapSubModels('columns', (column) => {
      return column.getColumnProps();
    })
      .filter(Boolean)
      .concat({
        key: 'empty',
      });
    if (this.context.flowSettingsEnabled) {
      cols.push({
        key: 'addColumn',
        fixed: 'right',
        width: 100,
        title: <AddFieldColumn model={this} />,
      } as any);
    }
    return adjustColumnOrder(cols);
  }

  EditableRow = (props) => {
    return <tr {...props} />;
  };

  EditableCell = observer<any>((props) => {
    const { className, title, editable, width, record, recordIndex, dataIndex, children, model, ...restProps } = props;
    const ref = useRef(null);
    if (editable) {
      return (
        <td
          ref={ref}
          {...restProps}
          className={classNames(
            className,
            css`
              .edit-icon {
                position: absolute;
                display: none;
                color: #1890ff;
                margin-left: 8px;
                cursor: pointer;
                z-index: 100;
                top: 50%;
                right: 8px;
                transform: translateY(-50%);
              }
              &:hover {
                background: rgba(24, 144, 255, 0.1) !important;
              }
              &:hover .edit-icon {
                display: inline-flex;
              }
            `,
          )}
        >
          <EditOutlined
            className="edit-icon"
            onClick={async (e) => {
              e.preventDefault();
              e.stopPropagation();
              // 阻止事件冒泡，避免触发行选中
              try {
                await QuickEditFormModel.open({
                  flowEngine: this.flowEngine,
                  target: ref.current,
                  dataSourceKey: this.collection.dataSourceKey,
                  collectionName: this.collection.name,
                  fieldPath: dataIndex,
                  filterByTk: this.collection.getFilterByTK(record),
                  record: record,
                  fieldProps: { ...model.props, ...model.subModels.field.props },
                  sourceFieldModelUid: model.subModels.field.uid,
                  onSuccess: (values) => {
                    const collectionField = this.collection.getField(dataIndex);
                    record[dataIndex] = values[dataIndex];
                    setNestedValue(this.resource.getData(), recordIndex, record);
                    // 仅重渲染单元格
                    const fork: ForkFlowModel = model.subModels.field.createFork({}, `${recordIndex}`);
                    // Provide expandable meta for current row record based on the collection in context
                    const recordMeta = createCurrentRecordMetaFactory(
                      fork.context,
                      () => (fork.context as any).collection,
                    );
                    fork.context.defineProperty('record', {
                      get: () => record,
                      cache: false,
                      meta: recordMeta,
                    });
                    fork.setProps({ ...model.props, value: values[dataIndex] });
                    fork.context.defineProperty('recordIndex', {
                      get: () => recordIndex,
                    });
                    if (collectionField?.targetCollection?.template === 'tree') {
                      this.resource.refresh(); //树形数据获取父节点信息
                    } else {
                      model.rerender();
                    }
                  },
                });
                // await this.resource.refresh();
              } catch (error) {
                // console.error('Error stopping event propagation:', error);
              }
            }}
          />
          <div
            ref={ref}
            className={css`
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
              width: calc(${width}px - 16px);
            `}
          >
            {children}
          </div>
        </td>
      );
    }
    return (
      <td className={classNames(className)} {...restProps}>
        <div style={{ width }}> {children}</div>
      </td>
    );
  });

  components = {
    header: {
      wrapper: HeaderWrapperComponent,
    },
    body: {
      // row: this.EditableRow,
      cell: this.EditableCell,
    },
  };

  renderCell = (checked, record, index, originNode) => {
    if (!this.props.dragSort && !this.props.showIndex) {
      return originNode;
    }
    const current = this.resource.getPage();

    const pageSize = this.resource.getPageSize() || 20;
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
          [rowSelectCheckboxWrapperClassHover]: true,
        })}
      >
        <div className={classNames(checked ? 'checked' : null, rowSelectCheckboxContentClass)}>
          {this.props.showIndex && <TableIndex index={index} />}
        </div>

        <div className={classNames('nb-origin-node', checked ? 'checked' : null, rowSelectCheckboxCheckedClassHover)}>
          {originNode}
        </div>
      </div>
    );
  };

  renderConfigureActions() {
    return (
      <AddSubModelButton
        key={'table-column-add-actions'}
        model={this}
        subModelBaseClass={this.getModelClassName('CollectionActionGroupModel')}
        subModelKey="actions"
      >
        <FlowSettingsButton icon={<SettingOutlined />}>{this.translate('Actions')}</FlowSettingsButton>
      </AddSubModelButton>
    );
  }

  pagination() {
    const totalCount = this.resource.getMeta('count');
    const pageSize = this.resource.getPageSize();
    const hasNext = this.resource.getMeta('hasNext');
    const current = this.resource.getPage();
    const data = this.resource.getData();
    if (totalCount) {
      return {
        current,
        pageSize,
        total: totalCount,
        showTotal: (total) => {
          return this.translate('Total {{count}} items', { count: total });
        },
        showSizeChanger: true,
      };
    } else {
      return {
        // showTotal: false,
        simple: true,
        showTitle: false,
        showSizeChanger: true,
        hideOnSinglePage: false,
        pageSize,
        total: data?.length < pageSize || !hasNext ? pageSize * current : pageSize * current + 1,
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
                    min-width: ${this.context.themeToken.controlHeight}px;
                  }
                `}
              >
                {originalElement} <div>{this.resource.getPage()}</div>
              </div>
            );
          } else {
            return originalElement;
          }
        },
      };
    }
  }

  renderComponent() {
    const highlightedRowKey = this.props.highlightedRowKey;
    const isConfigMode = !!this.context.flowSettingsEnabled;
    return !this.columns.value.length ? (
      <Skeleton paragraph={{ rows: 3 }} />
    ) : (
      <>
        <DndProvider>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: this.context.themeToken.margin,
              gap: this.context.themeToken.marginXXS,
            }}
          >
            <Space wrap>
              {this.mapSubModels('actions', (action) => {
                // @ts-ignore
                if (action.props.position === 'left') {
                  return (
                    <FlowModelRenderer
                      key={action.uid}
                      model={action}
                      showFlowSettings={{ showBackground: false, showBorder: false, toolbarPosition: 'above' }}
                    />
                  );
                }

                return null;
              })}
              {/* 占位 */}
              <span></span>
            </Space>
            <Space wrap>
              {this.mapSubModels('actions', (action) => {
                if (action.hidden && !isConfigMode) {
                  return;
                }
                // @ts-ignore
                if (action.props.position !== 'left') {
                  return (
                    <Droppable model={action} key={action.uid}>
                      <FlowModelRenderer
                        model={action}
                        showFlowSettings={{ showBackground: false, showBorder: false, toolbarPosition: 'above' }}
                        extraToolbarItems={[
                          {
                            key: 'drag-handler',
                            component: DragHandler,
                            sort: 1,
                          },
                        ]}
                      />
                    </Droppable>
                  );
                }

                return null;
              })}
              {this.renderConfigureActions()}
            </Space>
          </div>
        </DndProvider>
        <HighPerformanceSpin spinning={!!this.resource.loading}>
          <HighPerformanceTable
            model={this}
            size={this.props.size}
            virtual={this.props.virtual}
            dataSource={this.resource.getData()}
            columns={this.columns.value}
            pagination={this.pagination()}
            highlightedRowKey={highlightedRowKey}
            defaultExpandAllRows={this.props.defaultExpandAllRows}
            expandedRowKeys={this.props.expandedRowKeys}
          />
        </HighPerformanceSpin>
      </>
    );
  }
}

TableBlockModel.registerFlow({
  key: 'resourceSettings2',
  steps: {},
});

TableBlockModel.registerFlow({
  key: 'tableSettings',
  sort: 500,
  title: tExpr('Table settings'),
  steps: {
    quickEdit: {
      title: tExpr('Enable quick edit'),
      uiMode: { type: 'switch', key: 'editable' },
      defaultParams: {
        editable: false,
      },
      handler(ctx, params) {
        ctx.model.setProps('editable', params.editable);
      },
      async afterParamsSave(ctx, params, previousParams) {
        if (params?.editable === previousParams?.editable) return;

        const blockModel = ctx.model as TableBlockModel;
        blockModel.mapSubModels('columns', (column: any) => {
          const flow = column?.getFlow?.('tableColumnSettings');
          if (!flow?.getStep?.('quickEdit')) return;

          const quickEditParams = column.getStepParams?.('tableColumnSettings', 'quickEdit');
          if (quickEditParams && Object.prototype.hasOwnProperty.call(quickEditParams, 'editable')) {
            return;
          }

          const isReadonly = !!column?.collectionField?.readonly;
          const hasAssociationPath = !!column?.associationPathName;
          column.setProps('editable', isReadonly || hasAssociationPath ? false : !!params.editable);
        });
      },
    },
    showRowNumbers: {
      title: tExpr('Show row numbers'),
      uiMode: { type: 'switch', key: 'showIndex' },
      defaultParams: {
        showIndex: true,
      },
      handler(ctx, params) {
        ctx.model.setProps('showIndex', params.showIndex);
      },
    },
    pageSize: {
      title: tExpr('Page size'),
      uiMode: {
        type: 'select',
        key: 'pageSize',
        props: {
          options: [
            { label: '5', value: 5 },
            { label: '10', value: 10 },
            { label: '20', value: 20 },
            { label: '50', value: 50 },
            { label: '100', value: 100 },
            { label: '200', value: 200 },
          ],
        },
      },
      defaultParams: {
        pageSize: 20,
      },
      handler(ctx, params) {
        ctx.model.resource.loading = true;
        ctx.model.resource.setPage(1);
        ctx.model.resource.setPageSize(params.pageSize);
      },
    },
    dataScope: {
      use: 'dataScope',
      title: tExpr('Data scope'),
    },
    defaultSorting: {
      use: 'sortingRule',
      title: tExpr('Default sorting'),
    },
    treeTable: {
      title: tExpr('Enable tree table'),
      uiMode: { type: 'switch', key: 'treeTable' },
      hideInSettings(ctx) {
        if (ctx.model.collection.template !== 'tree') {
          return true;
        }
      },
      defaultParams: {
        treeTable: false,
      },
      handler(ctx, params) {
        ctx.model.setProps('treeTable', params.treeTable);
        ctx.model.resource.setRequestParameters({
          tree: params.treeTable,
        });
      },
    },
    defaultExpandAllRows: {
      title: tExpr('Expand all rows by default'),
      uiMode: { type: 'switch', key: 'defaultExpandAllRows' },
      hideInSettings(ctx) {
        if (ctx.model.collection.template !== 'tree') {
          return true;
        }
      },
      defaultParams: {
        defaultExpandAllRows: false,
      },
      handler(ctx, params) {
        ctx.model.setProps('defaultExpandAllRows', params.defaultExpandAllRows);
      },
    },
    tableDensity: {
      title: tExpr('Table density'),
      uiMode: (ctx) => {
        const t = ctx.t;
        return {
          type: 'select',
          key: 'size',
          props: {
            options: [
              { label: t('Large'), value: 'large' },
              { label: t('Middle'), value: 'middle' },
              { label: t('Small'), value: 'small' },
            ],
          },
        };
      },
      defaultParams: {
        size: 'middle',
      },
      handler(ctx, params) {
        ctx.model.setProps('size', params.size);
      },
    },
    // virtualScrolling: {
    //   title: tExpr('Enable virtual scrolling'),
    //   uiSchema: {
    //     virtual: {
    //       'x-component': 'Switch',
    //       'x-decorator': 'FormItem',
    //     },
    //   },
    //   defaultParams: {
    //     virtual: false,
    //   },
    //   handler(ctx, params) {
    //     ctx.model.setProps('virtual', params.virtual);
    //   },
    // },
    refreshData: {
      title: tExpr('Refresh data'),
      async handler(ctx, params) {
        await Promise.all(
          ctx.model.mapSubModels('columns', async (column) => {
            if (column.hidden) return;
            try {
              await column.dispatchEvent('beforeRender');
            } catch (err) {
              column['__autoFlowError'] = err;
              // 列级错误不再向上抛，避免拖垮整表；在单元格层用 ErrorBoundary 展示
            }
          }),
        );
      },
    },
  },
});

TableBlockModel.define({
  label: tExpr('Table'),
  group: tExpr('Content'),
  searchable: true,
  searchPlaceholder: tExpr('Search'),
  createModelOptions: () => ({
    use: 'TableBlockModel',
    subModels: {
      columns: [
        {
          use: 'TableActionsColumnModel',
        },
      ],
    },
  }),
  sort: 300,
});

const tableScroll = { x: 'max-content' };
const HighPerformanceTable = React.memo(
  (props: {
    model: TableBlockModel;
    size: any;
    virtual: boolean;
    dataSource: any;
    columns: any;
    pagination: any;
    highlightedRowKey: string;
    defaultExpandAllRows?: boolean;
    expandedRowKeys?: any[];
  }) => {
    const {
      model,
      size,
      virtual,
      dataSource,
      columns,
      pagination: _pagination,
      highlightedRowKey,
      defaultExpandAllRows,
      expandedRowKeys,
    } = props;
    const [selectedRowKeys, setSelectedRowKeys] = React.useState<string[]>(() =>
      model.resource.getSelectedRows().map((row) => getRowKey(row, model.collection.filterTargetKey)),
    );
    const rowSelection = useMemo(() => {
      return {
        columnWidth: 50,
        type: 'checkbox',
        onChange: (_, selectedRows) => {
          model.resource.setSelectedRows(selectedRows);
          setSelectedRowKeys(selectedRows.map((row) => getRowKey(row, model.collection.filterTargetKey)));
        },
        selectedRowKeys,
        renderCell: model.renderCell,
        ...model.rowSelectionProps,
      };
    }, [model, selectedRowKeys]);
    const handleChange = useCallback(
      async (pagination, filters, sorter) => {
        const globalSort = model.props.globalSort;
        const sort = sorter.order ? (sorter.order === `ascend` ? [sorter.field] : [`-${sorter.field}`]) : globalSort;
        if (sorter) {
          model.resource.setSort(sort);
        }
        if (model.resource.getPageSize() !== pagination.pageSize) {
          model.resource.setPage(1);
        } else {
          model.resource.setPage(pagination.current);
        }
        model.resource.loading = true;
        model.resource.setPageSize(pagination.pageSize);
        await model.resource.refresh();
        if (defaultExpandAllRows) {
          const newExpandedRowKeys = extractIds(model.resource.getData());
          setExpandedRowKeys(newExpandedRowKeys);
        }
      },
      [model, defaultExpandAllRows],
    );
    const rowClassName = useCallback(
      (record) => {
        return getRowKey(record, model.collection?.filterTargetKey) === highlightedRowKey ? highlightedRowClass : '';
      },
      [highlightedRowKey, model.collection?.filterTargetKey],
    );
    const pagination = useMemo(() => _pagination, [dataSource]);
    const onRow = useCallback(
      (record, rowIndex) => {
        const rowKey = getRowKey(record, model.collection.filterTargetKey);

        return {
          onClick: async (event) => {
            if (highlightedRowKey !== rowKey) {
              defineClickedRowRecordVariable(model, record);
              await model.dispatchEvent('rowClick', { record, rowIndex, event });
              removeClickedRowRecordVariable(model);
            } else {
              await model.dispatchEvent('rowClick', { record, rowIndex, event });
            }
          },
        };
      },
      [highlightedRowKey, model],
    );

    const [rowKeys, setExpandedRowKeys] = useState(expandedRowKeys || []);

    useEffect(() => {
      setExpandedRowKeys(expandedRowKeys);
    }, [expandedRowKeys]);
    const expandable = useMemo(() => {
      return {
        expandedRowKeys: rowKeys,
        onExpand: (expanded, record) => {
          setExpandedRowKeys((prev) => {
            if (expanded) {
              // 展开
              return [...(prev || []), record.id];
            } else {
              // 收起
              return prev?.filter((key) => key !== record.id);
            }
          });
        },
      };
    }, [rowKeys]);

    return (
      <MemoizedTable
        components={model.components}
        tableLayout="fixed"
        size={size}
        rowKey={(record) => getRowKey(record, model.collection.filterTargetKey)}
        rowSelection={rowSelection as any}
        virtual={virtual}
        scroll={tableScroll}
        dataSource={dataSource}
        columns={columns}
        pagination={pagination}
        onChange={handleChange}
        rowClassName={rowClassName}
        onRow={onRow}
        className={css`
          .ant-table-cell-ellipsis.ant-table-cell-fix-right-first .ant-table-cell-content {
            display: inline;
          }
          .ant-table-column-sorters .ant-table-column-title {
            overflow: visible;
          }
        `}
        defaultExpandAllRows={defaultExpandAllRows}
        expandable={expandable}
        indentSize={15}
      />
    );
  },
);

HighPerformanceTable.displayName = 'HighPerformanceTable';

TableBlockModel.registerEvents({
  rowClick: {
    title: tExpr('Row click'),
    name: 'rowClick',
    uiSchema: {
      condition: {
        type: 'object',
        title: tExpr('Trigger condition'),
        'x-decorator': 'FormItem',
        'x-component': (props) => {
          // eslint-disable-next-line react-hooks/rules-of-hooks
          const ctx = useFlowContext();
          // eslint-disable-next-line react-hooks/rules-of-hooks
          useEffect(() => {
            defineClickedRowRecordVariable(ctx.model, null);
            return () => removeClickedRowRecordVariable(ctx.model);
          }, [ctx.model]);

          return <ConditionBuilder {...props} />;
        },
      },
    },
    async handler(ctx, params) {
      commonConditionHandler(ctx, params);

      const model = ctx.model as TableBlockModel;
      const rowKey = getRowKey(ctx.inputArgs.record, model.collection.filterTargetKey);
      if (model.props.highlightedRowKey !== rowKey) {
        model.highlightRow(ctx.inputArgs.record);
      } else {
        model.clearHighlight();
      }
    },
  },
});

function defineClickedRowRecordVariable(model: TableBlockModel, value: any) {
  const recordMeta = createCurrentRecordMetaFactory(model.context, () => model.collection, {
    title: tExpr('Clicked row record'),
  });
  model.context.defineProperty('clickedRowRecord', {
    get: () => value,
    meta: recordMeta,
  });
}

function removeClickedRowRecordVariable(model: TableBlockModel) {
  model.context.defineProperty('clickedRowRecord', {});
}
