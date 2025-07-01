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
import { AddFieldButton, FlowModel, MultiRecordResource } from '@nocobase/flow-engine';
import { tval } from '@nocobase/utils/client';
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { Pagination, Spin, Tooltip } from 'antd';
import _ from 'lodash';
import React, { useRef } from 'react';
import { ActionModel } from '../../base/ActionModel';
import { DataBlockModel } from '../../base/BlockModel';
import { FieldModel } from '../../base/FieldModel';
import { ReadPrettyFieldModel } from '../../fields';
import { QuickEditForm } from '../form/QuickEditForm';

const CustomTd = ({ children, model, recordIndex, record, dataIndex }) => {
  const ref = useRef(null);
  return (
    <td
      ref={ref}
      // key={cell.id}
      className={css`
        position: relative;
        .edit-icon {
          position: absolute;
          opacity: 0;
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
          opacity: 1;
          display: inline-flex;
        }
      `}
    >
      <EditOutlined
        className="edit-icon"
        onClick={async (e) => {
          e.preventDefault();
          e.stopPropagation();
          // 阻止事件冒泡，避免触发行选中
          try {
            await QuickEditForm.open({
              flowEngine: model.flowEngine,
              target: ref.current,
              dataSourceKey: model.collection.dataSourceKey,
              collectionName: model.collection.name,
              fieldPath: dataIndex,
              filterByTk: record.id,
              onSuccess: (values) => {
                model.resource.setItem(recordIndex, {
                  ...record,
                  ...values,
                });
              },
            });
            // await this.resource.refresh();
          } catch (error) {
            // console.error('Error stopping event propagation:', error);
          }
        }}
      />
      {children}
    </td>
  );
};

const TanstackTable = observer(({ model }: { model: TanstackTableModel }) => {
  const rerender = React.useReducer(() => ({}), {})[1];

  const table = useReactTable({
    data: model.resource.getData(),
    columns: model.columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="p-2">
      <table>
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id}>
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody
          className={css`
            tr:hover {
              background-color: #f5f5f5;
            }
          `}
        >
          {table.getRowModel().rows.map((row, i) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell, j) => (
                <CustomTd
                  key={`${i}-${j}`} // 推荐这样
                  dataIndex={cell.column.id}
                  model={model}
                  recordIndex={row.index}
                  record={row.original}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </CustomTd>
              ))}
            </tr>
          ))}
        </tbody>
        {/* <tfoot>
          {table.getFooterGroups().map((footerGroup) => (
            <tr key={footerGroup.id}>
              {footerGroup.headers.map((header) => (
                <th key={header.id}>
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.footer, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </tfoot> */}
      </table>
    </div>
  );
});

export class TanstackTableTableColumnModel extends FieldModel {
  getColumnProps() {
    return {
      id: this.fieldPath,
      header: (info) => <span>{this.collectionField.title}</span>,
      cell: (info) => {
        return (
          <>
            {this.mapSubModels('field', (action: ReadPrettyFieldModel) => {
              const fork = action.createFork({}, `${info.row.id}`);
              fork.setSharedContext({ index: info.row.id, value: info.getValue(), currentRecord: info.row });
              return fork.render();
            })}
          </>
        );
      },
      // footer: (info) => info.column.id,
    };
  }
}

TanstackTableTableColumnModel.registerFlow({
  key: 'default',
  auto: true,
  steps: {
    step1: {
      async handler(ctx, params) {
        if (!params.dataSourceKey || !params.collectionName || !params.fieldPath) {
          throw new Error('dataSourceKey, collectionName and fieldPath are required parameters');
        }
        if (!ctx.shared.currentBlockModel) {
          throw new Error('Current block model is not set in shared context');
        }
        if (ctx.model.collectionField) {
          return;
        }
        const { dataSourceKey, collectionName, fieldPath } = params;
        const field = ctx.globals.dataSourceManager.getCollectionField(
          `${dataSourceKey}.${collectionName}.${fieldPath}`,
        );
        if (!field) {
          throw new Error(`Collection field not found: ${dataSourceKey}.${collectionName}.${fieldPath}`);
        }
        ctx.model.collectionField = field;
        ctx.model.fieldPath = params.fieldPath;
        ctx.model.setProps('title', field.title);
        ctx.model.setProps('dataIndex', field.name);
        await ctx.model.applySubModelsAutoFlows('field');
      },
    },
  },
});

type TanstackTableModelStructure = {
  subModels: {
    columns: TanstackTableTableColumnModel[];
    actions: ActionModel[];
  };
};

export class TanstackTableModel extends DataBlockModel<TanstackTableModelStructure> {
  declare resource: MultiRecordResource;

  columnHelper = createColumnHelper();

  get columns() {
    return this.mapSubModels('columns', (column) => {
      return this.columnHelper.accessor(column.fieldPath, column.getColumnProps());
    }).concat([
      this.columnHelper.accessor('id', {
        header: (info) => (
          <AddFieldButton
            collection={this.collection}
            model={this}
            subModelKey={'columns'}
            subModelBaseClass="ReadPrettyFieldModel"
            buildCreateModelOptions={({ defaultOptions, fieldPath }) => ({
              use: 'TanstackTableTableColumnModel',
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
            onModelCreated={async (model: TanstackTableTableColumnModel) => {
              await model.applyAutoFlows();
            }}
            onSubModelAdded={async (model: TanstackTableTableColumnModel) => {
              this.addAppends(model.fieldPath, true);
            }}
          />
        ),
        cell: (info) => null,
        footer: (info) => info.column.id,
      }),
    ]);
  }

  renderComponent() {
    return (
      <Spin spinning={this.resource.loading}>
        <div style={{ overflow: 'auto' }}>
          <TanstackTable model={this} />
        </div>
        <Pagination
          style={{ marginTop: 16 }}
          align="end"
          defaultCurrent={this.resource.getMeta('page')}
          defaultPageSize={this.resource.getMeta('pageSize')}
          total={this.resource.getMeta('count')}
          showSizeChanger
          onChange={async (page, pageSize) => {
            this.resource.loading = true;
            this.resource.setPage(page);
            this.resource.setPageSize(pageSize);
            await this.resource.refresh();
          }}
        />
      </Spin>
    );
  }
}

TanstackTableModel.define({
  title: tval('Tanstack Table'),
  group: tval('Content'),
  defaultOptions: {
    use: 'TanstackTableModel',
    subModels: {},
  },
});

TanstackTableModel.registerFlow({
  key: 'default',
  auto: true,
  steps: {
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
    // dataScope: {
    //   use: 'dataScope',
    //   title: tval('Set data scope'),
    // },
    refresh: {
      async handler(ctx, params) {
        await ctx.model.resource.refresh();
      },
    },
  },
});
