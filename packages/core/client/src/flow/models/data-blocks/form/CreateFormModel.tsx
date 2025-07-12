/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createForm } from '@formily/core';
import { escapeT, SingleRecordResource } from '@nocobase/flow-engine';
import { FormModel } from './FormModel';

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
