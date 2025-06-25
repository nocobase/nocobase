/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { EditOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import { observer } from '@formily/reactive-react';
import { AddActionButton, AddFieldButton, FlowModelRenderer, MultiRecordResource } from '@nocobase/flow-engine';
import { Card, Space, Spin, Table } from 'antd';
import classNames from 'classnames';
import _ from 'lodash';
import React, { useRef } from 'react';
import { ActionModel } from '../../base/ActionModel';
import { DataBlockModel } from '../../base/BlockModel';
import { QuickEditForm } from '../form/QuickEditForm';
import { TableColumnModel } from './TableColumnModel';

type TableModelStructure = {
  subModels: {
    columns: TableColumnModel[];
    actions: ActionModel[];
  };
};

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
                label: 'Actions column',
                createModelOptions: {
                  use: 'TableActionsColumnModel',
                },
              },
            ]}
            onModelCreated={async (model: TableColumnModel) => {
              // model.setSharedContext({ currentBlockModel: this });
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
    const { className, title, editable, width, record, dataIndex, children, ...restProps } = props;
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
              await QuickEditForm.open({
                target: ref.current,
                flowEngine: this.flowEngine,
                dataSourceKey: this.collection.dataSourceKey,
                collectionName: this.collection.name,
                fieldPath: dataIndex,
                filterByTk: record.id,
              });
              await this.resource.refresh();
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
    body: {
      // row: this.EditableRow,
      cell: this.EditableCell,
    },
  };

  render() {
    return (
      <Card>
        <Spin spinning={this.resource.loading}>
          <Space style={{ marginBottom: 16 }}>
            {this.mapSubModels('actions', (action) => (
              <FlowModelRenderer
                model={action}
                showFlowSettings={{ showBackground: false, showBorder: false }}
                sharedContext={{ currentBlockModel: this }}
              />
            ))}
            <AddActionButton model={this} subModelBaseClass="GlobalActionModel" subModelKey="actions" />
          </Space>
          <Table
            components={this.components}
            tableLayout="fixed"
            rowKey={this.collection.filterTargetKey}
            rowSelection={{
              type: 'checkbox',
              onChange: (_, selectedRows) => {
                this.resource.setSelectedRows(selectedRows);
              },
              selectedRowKeys: this.resource.getSelectedRows().map((row) => row.id),
            }}
            scroll={{ x: 'max-content', y: 'calc(100vh - 300px)' }}
            dataSource={this.resource.getData()}
            columns={this.getColumns()}
            pagination={{
              current: this.resource.getPage(),
              pageSize: this.resource.getPageSize(),
              total: this.resource.getMeta('count'),
            }}
            onChange={(pagination) => {
              this.resource.setPage(pagination.current);
              this.resource.setPageSize(pagination.pageSize);
              this.resource.loading = true;
              this.resource.refresh();
            }}
          />
        </Spin>
      </Card>
    );
  }
}

TableModel.registerFlow({
  key: 'default',
  auto: true,
  steps: {
    step1: {
      paramsRequired: true,
      hideInSettings: true,
      uiSchema: {
        dataSourceKey: {
          type: 'string',
          title: 'Data Source Key',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
          'x-component-props': {
            placeholder: 'Enter data source key',
          },
        },
        collectionName: {
          type: 'string',
          title: 'Collection Name',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
          'x-component-props': {
            placeholder: 'Enter collection name',
          },
        },
      },
      defaultParams: {
        dataSourceKey: 'main',
      },
      handler: async (ctx, params) => {
        if (ctx.model.resource) {
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
      title: 'Edit page size',
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
    refresh: {
      async handler(ctx, params) {
        await ctx.model.resource.refresh();
      },
    },
  },
});

TableModel.define({
  title: 'Table',
  group: 'Content',
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
