/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FormButtonGroup, FormLayout } from '@formily/antd-v5';
import { createForm, Form } from '@formily/core';
import { FormProvider } from '@formily/react';
import {
  AddActionButton,
  buildActionItems,
  DndProvider,
  DragHandler,
  Droppable,
  escapeT,
  FlowModelRenderer,
  MultiRecordResource,
  SingleRecordResource,
} from '@nocobase/flow-engine';
import { Pagination } from 'antd';
import React from 'react';
import { DataBlockModel } from '../../base/BlockModel';
import { BlockGridModel } from '../../base/GridModel';
import { FormActionModel } from './FormActionModel';
import { FormFieldGridModel } from './FormFieldGridModel';

export class FormModel extends DataBlockModel<{
  parent?: BlockGridModel;
  subModels?: { grid: FormFieldGridModel; actions?: FormActionModel[] };
}> {
  form: Form;
  declare resource: SingleRecordResource | MultiRecordResource;

  createResource(_ctx?: any, _params?: any): SingleRecordResource | MultiRecordResource {
    const resource = new SingleRecordResource();
    resource.isNewRecord = true; // Default to new record
    return resource;
  }

  renderComponent() {
    return (
      <FormProvider form={this.form}>
        <FormLayout layout={'vertical'}>
          <FlowModelRenderer model={this.subModels.grid} showFlowSettings={false} />
        </FormLayout>
        <DndProvider>
          <FormButtonGroup>
            {this.mapSubModels('actions', (action) => (
              <Droppable model={action} key={action.uid}>
                <FlowModelRenderer
                  key={action.uid}
                  model={action}
                  showFlowSettings={{ showBackground: false, showBorder: false }}
                  sharedContext={{ currentRecord: this.resource.getData() }}
                  extraToolbarItems={[
                    {
                      key: 'drag-handler',
                      component: DragHandler,
                      sort: 1,
                    },
                  ]}
                />
              </Droppable>
            ))}
            <AddActionButton model={this} items={buildActionItems(this, 'FormActionModel')} />
          </FormButtonGroup>
        </DndProvider>
      </FormProvider>
    );
  }
}

FormModel.registerFlow({
  key: 'formSettings',
  auto: true,
  title: escapeT('Form settings'),
  steps: {
    init: {
      async handler(ctx) {
        if (ctx.model.form) {
          return;
        }
        ctx.model.form = createForm();
        ctx.model.resource.on('refresh', () => {
          const record = ctx.model.resource.getData();
          const tragetKey = ctx.model.associationField?.targetKey;
          if (!ctx.model.resource.getFilterByTk() && tragetKey && record) {
            ctx.model.resource.setFilterByTk(record[tragetKey]);
          }
          ctx.model.form.setValues(ctx.model.resource.getData());
        });
      },
    },
    refresh: {
      async handler(ctx) {
        if (!ctx.model.resource) {
          throw new Error('Resource is not initialized');
        }
        await ctx.model.applySubModelsAutoFlows('grid');
        await ctx.model.resource.refresh();
        ctx.model.setSharedContext({
          currentRecord: ctx.model.resource.getData(),
        });
      },
    },
  },
});

FormModel.define({
  title: escapeT('Form'),
  group: 'Form',
  hide: true,
});

// CreateFormModel - 专门用于新增记录
export class CreateFormModel extends FormModel {
  createResource() {
    const resource = new SingleRecordResource();
    resource.isNewRecord = true; // 明确标记为新记录
    return resource;
  }
}

CreateFormModel.registerFlow({
  key: 'formSettings',
  auto: true,
  title: escapeT('Form settings'),
  steps: {
    init: {
      async handler(ctx) {
        if (ctx.model.form) {
          return;
        }
        ctx.model.form = createForm();
        // 新增表单不需要监听refresh事件，因为没有现有数据
      },
    },
    refresh: {
      async handler(ctx) {
        if (!ctx.model.resource) {
          throw new Error('Resource is not initialized');
        }
        await ctx.model.applySubModelsAutoFlows('grid');
        // 新增表单不需要刷新数据
        ctx.model.setSharedContext({
          currentRecord: {}, // 空记录
        });
      },
    },
  },
});

CreateFormModel.define({
  title: escapeT('Form (Add new)'),
  group: 'Form',
  defaultOptions: {
    use: 'CreateFormModel',
    subModels: {
      grid: {
        use: 'FormFieldGridModel',
      },
    },
  },
  sort: 350,
});

// EditFormModel - 专门用于编辑现有记录，借鉴DetailsModel的资源管理逻辑
export class EditFormModel extends FormModel {
  declare resource: MultiRecordResource | SingleRecordResource;

  createResource(_ctx: any, params: any) {
    // 完全借鉴DetailsModel的逻辑
    if (this.associationField?.type === 'hasOne' || this.associationField?.type === 'belongsTo') {
      const resource = new SingleRecordResource();
      resource.isNewRecord = false;
      return resource;
    }
    if (Object.keys(params).includes('filterByTk')) {
      const resource = new SingleRecordResource();
      resource.isNewRecord = false;
      return resource;
    }
    const resource = new MultiRecordResource();
    resource.setPageSize(1);
    return resource;
  }

  isMultiRecordResource() {
    return this.resource instanceof MultiRecordResource;
  }

  renderComponent() {
    // 获取当前记录数据
    const data = this.resource.getData();
    const currentRecord = Array.isArray(data) ? data[0] : data;

    // 分页切换处理函数（仅用于 MultiRecordResource）
    const onPageChange = async (page: number) => {
      if (this.resource instanceof MultiRecordResource) {
        const multiResource = this.resource as MultiRecordResource;
        multiResource.setPage(page);
        multiResource.loading = true;
        await multiResource.refresh();

        const newData = this.resource.getData();
        const newRecord = Array.isArray(newData) ? newData[0] : newData;

        this.setSharedContext({
          currentRecord: newRecord,
        });
        await this.form.reset();
        this.form.setValues(newRecord);
      }
    };

    return (
      <>
        <FormProvider form={this.form}>
          <FormLayout layout={'vertical'}>
            <FlowModelRenderer model={this.subModels.grid} showFlowSettings={false} />
          </FormLayout>
          <DndProvider>
            <FormButtonGroup>
              {this.mapSubModels('actions', (action) => (
                <Droppable model={action} key={action.uid}>
                  <FlowModelRenderer
                    key={action.uid}
                    model={action}
                    showFlowSettings={{ showBackground: false, showBorder: false }}
                    sharedContext={{
                      currentRecord: currentRecord,
                    }}
                    extraToolbarItems={[
                      {
                        key: 'drag-handler',
                        component: DragHandler,
                        sort: 1,
                      },
                    ]}
                  />
                </Droppable>
              ))}
              <AddActionButton model={this} items={buildActionItems(this, 'FormActionModel')} />
            </FormButtonGroup>
          </DndProvider>
        </FormProvider>
        {this.isMultiRecordResource() && (
          <div
            style={{
              textAlign: 'center',
              marginTop: 16,
            }}
          >
            <Pagination
              simple
              pageSize={1}
              showSizeChanger={false}
              defaultCurrent={(this.resource as MultiRecordResource).getPage()}
              total={(this.resource as MultiRecordResource).getTotalPage()}
              onChange={onPageChange}
              style={{ display: 'inline-block' }}
            />
          </div>
        )}
      </>
    );
  }
}

EditFormModel.registerFlow({
  key: 'formSettings',
  auto: true,
  title: escapeT('Edit form settings'),
  steps: {
    init: {
      async handler(ctx) {
        if (ctx.model.form) {
          return;
        }
        ctx.model.form = createForm();
        // 编辑表单需要监听refresh事件来加载现有数据
        ctx.model.resource.on('refresh', async () => {
          const data = ctx.model.resource.getData();
          const record = Array.isArray(data) ? data[0] : data;
          await ctx.model.form.reset();
          ctx.model.form.setValues(record);
        });

        // 如果资源已经有数据，立即设置到表单中
        const existingData = ctx.model.resource.getData();
        if (existingData) {
          const record = Array.isArray(existingData) ? existingData[0] : existingData;
          await ctx.model.form.reset();
          ctx.model.form.setValues(record);
        }
      },
    },
    refresh: {
      async handler(ctx) {
        if (!ctx.model.resource) {
          throw new Error('Resource is not initialized');
        }
        // 1. 先初始化字段网格，确保所有字段都创建完成
        await ctx.model.applySubModelsAutoFlows('grid');

        // 2. 加载数据
        await ctx.model.resource.refresh();
        const data = ctx.model.resource.getData();
        const record = Array.isArray(data) ? data[0] : data;

        // 3. 设置共享上下文
        ctx.model.setSharedContext({
          currentRecord: record,
        });

        await ctx.model.form.reset();
        ctx.model.form.setValues(record);
      },
    },
  },
});

EditFormModel.define({
  title: escapeT('Form (Edit)'),
  group: 'Form',
  defaultOptions: {
    use: 'EditFormModel',
    subModels: {
      grid: {
        use: 'FormFieldGridModel',
      },
    },
  },
  sort: 340,
});
