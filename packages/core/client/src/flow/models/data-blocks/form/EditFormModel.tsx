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
import { FormModel } from './FormModel';

export class EditFormModel extends FormModel {
  createResource(_ctx: any, params: any) {
    // 完全借鉴DetailsModel的逻辑
    if (this.association?.type === 'hasOne' || this.association?.type === 'belongsTo') {
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

  getCurrentRecord() {
    const data = this.resource.getData();
    return Array.isArray(data) ? data[0] : data;
  }

  handlePageChange = async (page: number) => {
    if (this.resource instanceof MultiRecordResource) {
      const multiResource = this.resource as MultiRecordResource;
      multiResource.setPage(page);
      multiResource.loading = true;
      await multiResource.refresh();
    }
  };

  renderComponent() {
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
              onChange={this.handlePageChange}
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
        if (!ctx.resource) {
          throw new Error('Resource is not initialized');
        }
        // 编辑表单需要监听refresh事件来加载现有数据
        ctx.resource.on('refresh', async () => {
          await ctx.form.reset();
          const currentRecord = ctx.model.getCurrentRecord();
          const targetKey = ctx.association?.targetKey;
          if (targetKey) {
            ctx.resource.setMeta({
              currentFilterByTk: currentRecord?.[targetKey],
            });
          } else {
            ctx.resource.setMeta({
              currentFilterByTk: ctx.collection.getFilterByTK(currentRecord),
            });
          }
          ctx.model.defineContextProperties({
            currentRecord,
          });
          ctx.model.form.setValues(currentRecord);
        });
      },
    },
    refresh: {
      async handler(ctx) {
        if (!ctx.resource) {
          throw new Error('Resource is not initialized');
        }
        // 1. 先初始化字段网格，确保所有字段都创建完成
        await ctx.model.applySubModelsAutoFlows('grid');
        // 2. 加载数据
        await ctx.resource.refresh();
      },
    },
  },
});

EditFormModel.define({
  title: escapeT('Form (Edit)'),
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
