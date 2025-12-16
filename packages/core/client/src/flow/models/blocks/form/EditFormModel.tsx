/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  DndProvider,
  DragHandler,
  Droppable,
  tExpr,
  FlowModelContext,
  FlowModelRenderer,
  MemoFlowModelRenderer,
  MultiRecordResource,
  SingleRecordResource,
} from '@nocobase/flow-engine';
import { Pagination, Space } from 'antd';
import { omitBy, isUndefined } from 'lodash';
import React from 'react';
import { BlockSceneEnum } from '../../base';
import { FormBlockModel, FormComponent } from './FormBlockModel';

export class EditFormModel extends FormBlockModel {
  static scene = BlockSceneEnum.oam;

  private actionFlowSettings = { showBackground: false, showBorder: false, toolbarPosition: 'above' as const };
  private actionExtraToolbarItems = [
    {
      key: 'drag-handler',
      component: DragHandler,
      sort: 1,
    },
  ];

  createResource(_ctx: FlowModelContext, params: any) {
    // 完全借鉴DetailsBlockModel的逻辑
    if (this.association?.type === 'hasOne' || this.association?.type === 'belongsTo') {
      const resource = this.context.createResource(SingleRecordResource);
      resource.isNewRecord = false;
      return resource;
    }
    if (Object.keys(params).includes('filterByTk')) {
      const resource = this.context.createResource(SingleRecordResource);
      resource.isNewRecord = false;
      return resource;
    }
    const resource = this.context.createResource(MultiRecordResource);
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
  getAclActionName() {
    return 'update';
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
    const { colon, labelAlign, labelWidth, labelWrap, layout } = this.props;
    const isConfigMode = !!this.flowEngine?.flowSettings?.enabled;

    return (
      <FormComponent model={this} layoutProps={{ colon, labelAlign, labelWidth, labelWrap, layout }}>
        <FlowModelRenderer model={this.subModels.grid} showFlowSettings={false} />
        <DndProvider>
          <Space>
            {this.mapSubModels('actions', (action) => {
              if (action.hidden && !isConfigMode) {
                return;
              }
              return (
                <Droppable model={action} key={action.uid}>
                  <MemoFlowModelRenderer
                    key={action.uid}
                    model={action}
                    showFlowSettings={this.flowEngine.flowSettings.enabled ? this.actionFlowSettings : false}
                    extraToolbarItems={this.actionExtraToolbarItems}
                  />
                </Droppable>
              );
            })}
            {this.renderConfigureActions()}
          </Space>
        </DndProvider>
        {this.isMultiRecordResource() && this.resource.getMeta('count') > 1 && (
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
      </FormComponent>
    );
  }
}

EditFormModel.registerFlow({
  key: 'formSettings',
  title: tExpr('Edit form settings'),
  steps: {
    init: {
      async handler(ctx) {
        if (!ctx.resource) {
          throw new Error('Resource is not initialized');
        }
        // 编辑表单需要监听refresh事件来加载现有数据
        ctx.resource.on('refresh', async () => {
          // if (ctx.form) {
          //   await ctx.form.resetFields();
          // }

          const currentRecord = {
            ...ctx.model.getCurrentRecord(),
          };
          if (!currentRecord) {
            return;
          }
          const targetKey = ctx.association?.targetKey;

          if (targetKey && ctx.association?.interface !== 'm2m') {
            ctx.resource.setMeta({
              currentFilterByTk: currentRecord?.[targetKey],
            });
          } else {
            ctx.resource.setMeta({
              currentFilterByTk: ctx.collection.getFilterByTK(currentRecord),
            });
          }
          ctx.form && ctx.form.setFieldsValue(currentRecord);
        });
      },
    },
    dataScope: {
      use: 'dataScope',
    },
    refresh: {
      async handler(ctx) {
        if (!ctx.resource) {
          throw new Error('Resource is not initialized');
        }
      },
    },
  },
});

EditFormModel.define({
  label: tExpr('Form (Edit)'),
  searchable: true,
  searchPlaceholder: tExpr('Search'),
  createModelOptions: {
    use: 'EditFormModel',
    subModels: {
      grid: {
        use: 'FormGridModel',
      },
    },
  },
  sort: 340,
});
