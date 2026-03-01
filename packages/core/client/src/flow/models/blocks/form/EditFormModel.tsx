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
import { isEqual } from 'lodash';
import React from 'react';
import { BlockSceneEnum } from '../../base';
import { FormBlockContent, FormBlockModel } from './FormBlockModel';
import { submitHandler } from './submitHandler';
import { dispatchEventDeep } from '../../../utils';

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
      await dispatchEventDeep(this, 'paginationChange');
    }
  };

  async submitHandler(ctx, params: any, cb?: (values?: any, filterByTk?: any) => void) {
    await submitHandler(ctx, params, cb);
  }

  async submit(params: any = {}, cb?: (values?: any, filterByTk?: any) => void) {
    await submitHandler(this.context, params, cb);
  }

  renderComponent() {
    const { colon, labelAlign, labelWidth, labelWrap, layout } = this.props;
    const isConfigMode = !!this.context.flowSettingsEnabled;
    const { heightMode, height } = this.decoratorProps;
    const footer =
      this.isMultiRecordResource() && this.resource.getMeta('count') > 1 ? (
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
      ) : null;

    return (
      <FormBlockContent
        model={this}
        gridModel={this.subModels.grid}
        layoutProps={{ colon, labelAlign, labelWidth, labelWrap, layout }}
        heightMode={heightMode}
        height={height}
        grid={<FlowModelRenderer model={this.subModels.grid} showFlowSettings={false} />}
        actions={
          <DndProvider>
            <Space wrap>
              {this.mapSubModels('actions', (action) => {
                if (action.hidden && !isConfigMode) {
                  return;
                }
                return (
                  <Droppable model={action} key={action.uid}>
                    <MemoFlowModelRenderer
                      key={action.uid}
                      model={action}
                      showFlowSettings={this.context.flowSettingsEnabled ? this.actionFlowSettings : false}
                      extraToolbarItems={this.actionExtraToolbarItems}
                    />
                  </Droppable>
                );
              })}
              {this.renderConfigureActions()}
            </Space>
          </DndProvider>
        }
        footer={footer}
      />
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

          const prevFilterByTk = ctx.resource.getMeta('currentFilterByTk');

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

          if (!ctx.form) {
            return;
          }

          const nextFilterByTk = ctx.resource.getMeta('currentFilterByTk');
          const recordChanged = !isEqual(prevFilterByTk, nextFilterByTk);
          const userModified = ctx.model.getUserModifiedFields?.() as Set<string> | undefined;
          const hasUserModified = !!userModified?.size;
          const pruneUserModified = () => {
            if (!userModified?.size) return;
            const isObject = (val) => val !== null && typeof val === 'object';
            // 只要当前表单值与服务端记录一致，就认为不再是“未保存修改”
            for (const fieldName of Array.from(userModified)) {
              const formValue = ctx.form.getFieldValue(fieldName);
              const recordValue = currentRecord?.[fieldName];
              if (
                Object.is(formValue, recordValue) ||
                (isObject(formValue) && isObject(recordValue) && isEqual(formValue, recordValue))
              ) {
                userModified.delete(fieldName);
              }
            }
          };

          // 当编辑表单存在未保存修改时，避免刷新覆盖用户输入（如：关系字段 Quick Create 导致的脏刷新）
          if (!recordChanged && hasUserModified) {
            const mergedRecord = { ...currentRecord };
            for (const fieldName of userModified) {
              mergedRecord[fieldName] = ctx.form.getFieldValue(fieldName);
            }

            ctx.form.setFieldsValue(mergedRecord);
            pruneUserModified();
            return;
          }

          // 切换记录（翻页等）时，清理“用户改动标记”，避免把上一条记录的编辑状态带到下一条
          if (recordChanged) {
            ctx.model.resetUserModifiedFields?.();
          }

          ctx.form.setFieldsValue(currentRecord);
          pruneUserModified();
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

EditFormModel.registerFlow({
  key: 'paginationChange',
  on: 'paginationChange',
  steps: {
    blockLinkageRulesRefresh: {
      use: 'linkageRulesRefresh',
      defaultParams: {
        actionName: 'blockLinkageRules',
        flowKey: 'cardSettings',
        stepKey: 'linkageRules',
      },
    },
    fieldsLinkageRulesRefresh: {
      use: 'linkageRulesRefresh',
      defaultParams: {
        actionName: 'fieldLinkageRules',
        flowKey: 'eventSettings',
        stepKey: 'linkageRules',
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
