/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineAction, escapeT } from '@nocobase/flow-engine';

export const pattern = defineAction({
  name: 'pattern',
  title: escapeT('Display mode'),
  uiSchema: (ctx) => {
    return {
      pattern: {
        'x-component': 'Select',
        'x-decorator': 'FormItem',
        enum: [
          {
            value: 'editable',
            label: escapeT('Editable'),
          },
          {
            value: 'disabled',
            label: escapeT('Disabled'),
          },

          {
            value: 'readPretty',
            label: escapeT('Display only'),
          },
        ],
      },
    };
  },
  defaultParams: (ctx) => ({
    pattern: ctx.model.collectionField.readonly ? 'disabled' : 'editable',
  }),
  beforeParamsSave: async (ctx, params, previousParams) => {
    const model: any = ctx.model;

    if (params.pattern === 'readPretty') {
      const use = model.collectionField.getFirstSubclassNameOf('ReadPrettyFieldModel') || 'ReadPrettyFieldModel';
      await ctx.engine.replaceModel(model.subModels['field']['uid'], {
        use: use,
        stepParams: {
          fieldSettings: {
            init: model.getFieldSettingsInitParams(),
          },
        },
      });
    } else {
      const use = model.collectionField.getFirstSubclassNameOf('FormFieldModel') || 'FormFieldModel';
      if (previousParams.pattern === 'readPretty') {
        await ctx.engine.replaceModel(ctx.model.subModels['field']['uid'], {
          use: use,
          stepParams: {
            fieldSettings: {
              init: model.getFieldSettingsInitParams(),
            },
          },
        });
      }
    }
  },
  async handler(ctx, params) {
    if (params.pattern === 'readPretty') {
      ctx.model.setProps({
        pattern: 'readPretty',
      });
    } else {
      ctx.model.setProps({
        disabled: params.pattern === 'disabled',
      });
    }
  },
});
