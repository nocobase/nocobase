/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { EditOutlined } from '@ant-design/icons';
import { DragEndEvent } from '@dnd-kit/core';
import { css } from '@emotion/css';
import { observer } from '@formily/reactive-react';
import {
  AddActionButton,
  AddFieldButton,
  DndProvider,
  DragHandler,
  Droppable,
  FlowModelRenderer,
  ForkFlowModel,
  MultiRecordResource,
  useFlowEngine,
} from '@nocobase/flow-engine';
import { tval } from '@nocobase/utils/client';
import { Space, Spin, Table } from 'antd';
import classNames from 'classnames';
import _ from 'lodash';
import React, { useRef } from 'react';
import { ActionModel } from '../../base/ActionModel';
import { DataBlockModel } from '../../base/BlockModel';
import { QuickEditForm } from '../form/QuickEditForm';
import { TableColumnModel } from './TableColumnModel';
import { extractIndex } from './utils';

type TableModelStructure = {
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

export class TableModel extends DataBlockModel<TableModelStructure> {
  declare resource: MultiRecordResource;

  getColumns() {
    return this.mapSubModels('columns', (column) => {
      return column.getColumnProps();
    })
      .concat({
        key: 'empty',
      })
      .concat({
        key: 'addColumn',
        fixed: 'right',
        width: 200,
        title: (
          <AddFieldButton
            collection={this.collection}
            model={this}
            subModelKey={'columns'}
            subModelBaseClass="ReadPrettyFieldModel"
            buildCreateModelOptions={({ defaultOptions, fieldPath }) => ({
              use: 'TableColumnModel',
              stepParams: {
                default: {
                  step1: {
                    dataSourceKey: this.collection.dataSourceKey,
                    collectionName: this.collection.name,
                    fieldPath,
                  },
                },
              },
              subModels: {
                field: {
                  // @ts-ignore
                  use: defaultOptions.use as any,
                  stepParams: {
                    default: {
                      step1: {
                        dataSourceKey: this.collection.dataSourceKey,
                        collectionName: this.collection.name,
                        fieldPath,
                      },
                    },
                  },
                },
              },
            })}
            appendItems={[
              {
                key: 'actions',
                label: this.translate('Actions column'),
                createModelOptions: {
                  use: 'TableActionsColumnModel',
                },
                toggleDetector: (ctx) => {
                  // 检测是否已存在操作列
                  const subModels = ctx.model.subModels.columns;
                  const modelClass = ctx.model.flowEngine.getModelClass('TableActionsColumnModel');
                  if (Array.isArray(subModels)) {
                    return subModels.some((subModel) => {
                      return subModel instanceof modelClass;
                    });
                  }
                  return false;
                },
              },
            ]}
            onModelCreated={async (model: TableColumnModel) => {
              await model.applyAutoFlows();
            }}
            onSubModelAdded={async (model: TableColumnModel) => {
              this.addAppends(model.fieldPath, true);
            }}
          />
        ),
      } as any);
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
                await QuickEditForm.open({
                  flowEngine: this.flowEngine,
                  target: ref.current,
                  dataSourceKey: this.collection.dataSourceKey,
                  collectionName: this.collection.name,
                  fieldPath: dataIndex,
                  filterByTk: record.id,
                  record: record,
                  onSuccess: (values) => {
                    this.resource.getData()[recordIndex][dataIndex] = values[dataIndex];
                    // 仅重渲染单元格
                    const fork: ForkFlowModel = model.subModels.field.getFork(`${recordIndex}`);
                    fork.setSharedContext({ index: recordIndex, value: values[dataIndex], currentRecord: record });
                    fork.rerender();
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
        <div
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

  renderComponent() {
    return (
      <>
        <DndProvider>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Space>
              {this.mapSubModels('actions', (action) => {
                // @ts-ignore
                if (action.props.position === 'left') {
                  return (
                    <FlowModelRenderer model={action} showFlowSettings={{ showBackground: false, showBorder: false }} />
                  );
                }

                return null;
              })}
              {/* 占位 */}
              <span></span>
            </Space>
            <Space>
              {this.mapSubModels('actions', (action) => {
                // @ts-ignore
                if (action.props.position !== 'left') {
                  return (
                    <Droppable model={action}>
                      <FlowModelRenderer
                        model={action}
                        showFlowSettings={{ showBackground: false, showBorder: false }}
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
              <AddActionButton model={this} subModelBaseClass="GlobalActionModel" subModelKey="actions" />
            </Space>
          </div>
        </DndProvider>
        <Table
          components={this.components}
          tableLayout="fixed"
          size={this.props.size}
          rowKey={this.collection.filterTargetKey}
          rowSelection={
            this.props.showIndex && {
              columnWidth: 50,
              type: 'checkbox',
              onChange: (_, selectedRows) => {
                this.resource.setSelectedRows(selectedRows);
              },
              selectedRowKeys: this.resource.getSelectedRows().map((row) => row.id),
              renderCell: this.renderCell,
            }
          }
          loading={this.resource.loading}
          virtual={this.props.virtual}
          scroll={{ x: 'max-content', y: '100%' }}
          dataSource={this.resource.getData()}
          columns={this.getColumns()}
          pagination={{
            current: this.resource.getPage(),
            pageSize: this.resource.getPageSize(),
            total: this.resource.getMeta('count'),
          }}
          onChange={(pagination) => {
            console.log('onChange pagination:', pagination);
            this.resource.loading = true;
            this.resource.setPage(pagination.current);
            this.resource.setPageSize(pagination.pageSize);
            this.resource.refresh();
          }}
        />
      </>
    );
  }
}

TableModel.registerFlow({
  key: 'default',
  auto: true,
  steps: {
    virtual: {
      title: tval('Virtual'),
      uiSchema: {
        virtual: {
          'x-component': 'Switch',
          'x-decorator': 'FormItem',
        },
      },
      defaultParams: {
        virtual: false,
      },
      handler(ctx, params) {
        ctx.model.setProps('virtual', params.virtual);
      },
    },
    enableEditable: {
      title: tval('Editable'),
      uiSchema: {
        editable: {
          'x-component': 'Switch',
          'x-decorator': 'FormItem',
        },
      },
      defaultParams: {
        editable: false,
      },
      handler(ctx, params) {
        console.log('enableEditable params:', params);
        ctx.model.setProps('editable', params.editable);
      },
    },
    step1: {
      paramsRequired: true,
      hideInSettings: true,
      uiSchema: {
        dataSourceKey: {
          type: 'string',
          title: tval('Data Source Key'),
          'x-decorator': 'FormItem',
          'x-component': 'Input',
          'x-component-props': {
            placeholder: tval('Enter data source key'),
          },
        },
        collectionName: {
          type: 'string',
          title: tval('Collection Name'),
          'x-decorator': 'FormItem',
          'x-component': 'Input',
          'x-component-props': {
            placeholder: tval('Enter collection name'),
          },
        },
      },
      defaultParams: {
        dataSourceKey: 'main',
      },
      handler: async (ctx, params) => {
        if (ctx.model.resource) {
          ctx.model.applySubModelsAutoFlows('columns');
          return;
        }
        const collection = ctx.globals.dataSourceManager.getCollection(params.dataSourceKey, params.collectionName);
        ctx.model.collection = collection;
        const resource = new MultiRecordResource();
        resource.setDataSourceKey(params.dataSourceKey);
        resource.setResourceName(params.collectionName);
        resource.setAPIClient(ctx.globals.api);
        resource.setPageSize(20);
        ctx.model.resource = resource;
        await ctx.model.applySubModelsAutoFlows('columns');
      },
    },
    editPageSize: {
      title: tval('Edit page size'),
      uiSchema: {
        pageSize: {
          'x-component': 'Select',
          'x-decorator': 'FormItem',
          enum: [
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
        ctx.model.resource.setPageSize(params.pageSize);
      },
    },
    dataScope: {
      use: 'dataScope',
      title: tval('Set data scope'),
    },
    sortingRule: {
      use: 'sortingRule',
      title: tval('Set default sorting rules'),
    },
    dataLoadingMode: {
      use: 'dataLoadingMode',
      title: tval('Set data loading mode'),
    },
    enabledIndexColumn: {
      title: tval('Enable index column'),
      uiSchema: {
        showIndex: {
          'x-component': 'Switch',
          'x-decorator': 'FormItem',
        },
      },
      defaultParams: {
        showIndex: true,
      },
      handler(ctx, params) {
        ctx.model.setProps('showIndex', params.showIndex);
      },
    },
    tableSize: {
      title: tval('Table size'),
      uiSchema: {
        size: {
          'x-component': 'Select',
          'x-decorator': 'FormItem',
          enum: [
            { label: tval('Large'), value: 'large' },
            { label: tval('Middle'), value: 'middle' },
            { label: tval('Small'), value: 'small' },
          ],
        },
      },
      defaultParams: {
        size: 'middle',
      },
      handler(ctx, params) {
        ctx.model.setProps('size', params.size);
      },
    },
    refresh: {
      async handler(ctx, params) {
        const { dataLoadingMode } = ctx.model.props;
        if (dataLoadingMode === 'auto') {
          await ctx.model.resource.refresh();
        } else {
          ctx.model.resource.loading = false;
        }
      },
    },
  },
});

TableModel.define({
  title: tval('Table'),
  group: tval('Content'),
  defaultOptions: {
    use: 'TableModel',
    subModels: {
      columns: [
        {
          use: 'TableActionsColumnModel',
        },
      ],
    },
  },
});
