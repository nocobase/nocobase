/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineAction } from '@nocobase/flow-engine';
import { tval } from '@nocobase/utils/client';
import { FieldModel } from '../models/base/FieldModel';

export const fieldComponent = defineAction({
  title: tval('Field component'),
  name: 'fieldComponent',
  uiSchema: (ctx) => {
    const classes = [...(ctx.model as FieldModel).collectionField.getSubclassesOf('ReadPrettyFieldModel').keys()];
    if (classes.length === 1) {
      return null;
    }
    return {
      use: {
        type: 'string',
        'x-component': 'Select',
        'x-decorator': 'FormItem',
        enum: classes.map((model) => ({
          label: model,
          value: model,
        })),
      },
    };
  },
  beforeParamsSave: async (ctx, params, previousParams) => {
    if (params.use !== previousParams.use) {
      console.log(params.use);
      await ctx.engine.replaceModel(ctx.model.subModels['field']['uid'], {
        use: params.use,
        stepParams: {
          fieldSettings: {
            init: (ctx.model as FieldModel).getFieldSettingsInitParams(),
          },
        },
      });
    }
  },
  defaultParams: (ctx) => {
    return {
      use: (ctx.model.subModels.field as FieldModel).use,
    };
  },
  async handler(ctx, params) {
    console.log('Sub model step1 handler');
    if (!params.use) {
      throw new Error('model use is a required parameter');
    }
    ctx.model.setProps({ subModel: params.use });
  },
});
