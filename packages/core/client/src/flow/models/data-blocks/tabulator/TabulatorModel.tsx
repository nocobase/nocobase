/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SettingOutlined } from '@ant-design/icons';
import { observer } from '@formily/react';
import {
  AddActionButton,
  AddFieldButton,
  CollectionField,
  FlowModel,
  FlowModelRenderer,
  FlowsFloatContextMenu,
  MultiRecordResource,
} from '@nocobase/flow-engine';
import { tval } from '@nocobase/utils/client';
import { Button, Card, Pagination, Skeleton, Space } from 'antd';
import _ from 'lodash';
import React from 'react';
import { ColumnDefinition, TabulatorFull as Tabulator } from 'tabulator-tables';
import { ActionModel } from '../../base/ActionModel';
import { DataBlockModel } from '../../base/BlockModel';
import { ReadPrettyFieldModel } from '../../fields/ReadPrettyField/ReadPrettyFieldModel';
import { AntdInputEditor } from './AntdInputEditor';
import './tabulator.css';

type S = {
  subModels: {
    columns: TabulatorColumnModel[];
    actions: ActionModel[];
  };
};

export class TabulatorColumnModel extends FlowModel {
  collectionField: CollectionField;
  fieldPath: string;

  getColumnProps(): ColumnDefinition {
    return {
      title: tval('abcd'),
      width: 100,
      headerSort: false,
      editable: true,
      field: this.collectionField.name,
      editor: (cell, onRendered, success, cancel) => {
        return this.reactView.render(
          <AntdInputEditor value={cell.getValue()} onSuccess={success} onCancel={cancel} />,
          { onRendered },
        );
      },
      titleFormatter: (cell) => {
        return this.reactView.render(<span>{this.collectionField.title}</span>);
      },
      formatter: (cell) => {
        return this.reactView.render(
          <span>
            {this.mapSubModels('field', (action: ReadPrettyFieldModel) => {
              const fork = action.createFork({}, `${cell.getRow().getIndex()}`);
              fork.setSharedContext({ index: cell.getRow().getIndex(), value: cell.getValue() });
              return fork.render();
            })}
          </span>,
        );
      },
    };
  }
}

TabulatorColumnModel.registerFlow({
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

const Columns = observer<any>(({ record, model, index }) => {
  return (
    <Space>
      {model.mapSubModels('actions', (action: ActionModel) => {
        const fork = action.createFork({}, `${index}`);
        return (
          <FlowModelRenderer fallback={<Skeleton.Button size="small" />} showFlowSettings key={fork.uid} model={fork} />
        );
      })}
    </Space>
  );
});

export class TabulatorTableActionsColumnModel extends TabulatorColumnModel {
  getColumnProps(): ColumnDefinition {
    return {
      title: 'ID',
      headerSort: false,
      field: 'id',
      width: 200,
      titleFormatter: (cell) => {
        return this.reactView.render(
          <FlowsFloatContextMenu
            model={this}
            containerStyle={{ display: 'block', padding: '11px 8px', margin: '-11px -8px' }}
          >
            <Space>
              {this.props.title || tval('Actions')}
              <AddActionButton model={this} subModelBaseClass="RecordActionModel" subModelKey="actions">
                <SettingOutlined />
              </AddActionButton>
            </Space>
          </FlowsFloatContextMenu>,
        );
      },
      formatter: (cell) => {
        return this.reactView.render(
          <Columns model={this} record={cell.getRow().getData()} index={cell.getRow().getIndex()} />,
        );
      },
    };
  }
}

export class TabulatorModel extends DataBlockModel<S> {
  declare resource: MultiRecordResource;
  tabulator: Tabulator;
  tabulatorRef: React.RefObject<HTMLDivElement> = React.createRef();

  getColumns() {
    return this.mapSubModels('columns', (column) => {
      return column.getColumnProps();
    }).concat({
      frozen: true,
      frozenPosition: 'right',
      title: 'abcd',
      width: 200,
      headerSort: false,
      titleFormatter: (cell) => {
        return this.reactView.render(
          <AddFieldButton
            collection={this.collection}
            model={this}
            subModelKey={'columns'}
            subModelBaseClass="ReadPrettyFieldModel"
            buildCreateModelOptions={({ defaultOptions, fieldPath }) => ({
              use: 'TabulatorColumnModel',
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
                label: tval('Actions column'),
                createModelOptions: {
                  use: 'TabulatorTableActionsColumnModel',
                },
              },
            ]}
            onModelCreated={async (model: TabulatorColumnModel) => {
              await model.applyAutoFlows();
            }}
            onSubModelAdded={async (model: TabulatorColumnModel) => {
              this.addAppends(model.fieldPath, true);
              this.initTabulator();
            }}
          />,
        );
      },
    } as ColumnDefinition);
  }

  async initTabulator() {
    if (this.tabulator) {
      this.tabulator.destroy();
    }
    if (!this.tabulatorRef.current) {
      throw new Error('Tabulator ref is not ready');
    }
    await new Promise((resolve) => {
      setTimeout(resolve, 100);
    });
    this.tabulator = new Tabulator(this.tabulatorRef.current, {
      layout: 'fitColumns', // fit columns to width of table (optional)
      height: '75vh',
      renderHorizontal: 'virtual',
      movableColumns: true,
      movableRows: true,
      rowFormatter: (row) => {
        row.getElement().style.height = '40px';
      },
      data: this.resource.getData(),
      columns: [
        {
          title: '',
          titleFormatter: 'rowSelection', // 复选框全选按钮
          formatter: 'rowSelection', // 复选框单选按钮
          hozAlign: 'center',
          headerHozAlign: 'center',
          headerSort: false,
          width: 50,
          frozen: true,
          titleFormatterParams: { rowRange: 'active' }, // 只全选当前页数据
        },
        ...this.getColumns(),
      ],
      autoResize: true,
    });
    this.tabulator.on('rowSelectionChanged', (data, rows) => {
      this.resource.setSelectedRows(data);
    });
  }

  render() {
    return (
      <Card>
        {/* <Space style={{ marginBottom: 16 }}>
          {this.mapSubModels('actions', (action) => (
            <FlowModelRenderer model={action} showFlowSettings sharedContext={{ currentBlockModel: this }} />
          ))}
          <AddActionButton model={this} subModelBaseClass="GlobalActionModel" subModelKey="actions">
            <Button icon={<SettingOutlined />}>{this.translate('Configure actions')}</Button>
          </AddActionButton>
        </Space> */}
        <div ref={this.tabulatorRef} />
        <Pagination
          style={{ marginTop: 16 }}
          align="end"
          defaultCurrent={this.resource.getMeta('page')}
          defaultPageSize={this.resource.getMeta('pageSize')}
          total={this.resource.getMeta('count')}
          showSizeChanger
          onChange={async (page, pageSize) => {
            this.resource.setPage(page);
            this.resource.setPageSize(pageSize);
            await this.resource.refresh();
          }}
        />
      </Card>
    );
  }
}

TabulatorModel.registerFlow({
  key: 'default',
  auto: true,
  steps: {
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
        const collection = ctx.globals.dataSourceManager.getCollection(params.dataSourceKey, params.collectionName);
        ctx.model.collection = collection;
        const resource = new MultiRecordResource();
        resource.setDataSourceKey(params.dataSourceKey);
        resource.setResourceName(params.collectionName);
        resource.setAPIClient(ctx.globals.api);
        resource.setPageSize(20);
        ctx.model.resource = resource;
        await ctx.model.applySubModelsAutoFlows('columns', null, { currentBlockModel: ctx.model });
        // await resource.refresh();
        resource.on('refresh', async () => {
          if (ctx.model.tabulator) {
            ctx.model.initTabulator();
            // await ctx.model.tabulator.setData(resource.getData()); // 深拷贝数据，避免 Tabulator 内部引用问题
          }
        });
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
    step2: {
      handler(ctx, params) {
        ctx.reactView.onRefReady(ctx.model.tabulatorRef, (el) => {
          ctx.model.initTabulator();
        });
      },
    },
    refresh: {
      async handler(ctx, params) {
        await ctx.model.resource.refresh();
      },
    },
  },
});

TabulatorModel.define({
  title: tval('Tabulator'),
  group: tval('Content'),
  requiresDataSource: true,
  // hide: true,
  defaultOptions: {
    use: 'TabulatorModel',
  },
});
