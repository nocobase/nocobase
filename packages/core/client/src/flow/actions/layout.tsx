/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineAction, escapeT } from '@nocobase/flow-engine';
import { tval } from '@nocobase/utils/client';

export const layout = defineAction({
  title: tval('Set block layout'),
  name: 'layout',
  uiSchema: {
    layout: {
      type: 'string',
      enum: [
        { label: tval('Vertical'), value: 'vertical' },
        { label: tval('Horizontal'), value: 'horizontal' },
      ],
      required: true,
      'x-decorator': 'FormItem',
      'x-component': 'Radio.Group',
    },
    labelAlign: {
      title: tval('Label align'),
      type: 'string',
      'x-decorator': 'FormItem',
      'x-component': 'Select',
      enum: [
        { label: "{{t('Right')}}", value: 'right' },
        { label: "{{t('Left')}}", value: 'left' },
      ],
      'x-reactions': [
        (field) => {
          const { layout } = field.form.values;
          field.hidden = layout === 'vertical';
        },
      ],
    },
    labelWidth: {
      title: tval('Label width'),
      type: 'string',
      required: true,
      'x-decorator': 'FormItem',
      'x-component': 'NumberPicker',
      'x-component-props': {
        addonAfter: 'px',
      },
      'x-validator': [
        {
          minimum: 50,
        },
      ],
      'x-reactions': [
        (field) => {
          const { layout } = field.form.values;
          field.hidden = layout === 'vertical';
        },
      ],
    },
    labelWrap: {
      type: 'string',
      title: tval('When the Label exceeds the width'),
      enum: [
        { label: tval('Line break'), value: true },
        { label: tval('Ellipsis'), value: false },
      ],
      'x-decorator': 'FormItem',
      'x-component': 'Radio.Group',
      'x-reactions': [
        (field) => {
          const { layout } = field.form.values;
          field.hidden = layout === 'vertical';
        },
      ],
    },
    colon: {
      type: 'boolean',
      'x-content': tval('Colon'),
      required: true,
      'x-decorator': 'FormItem',
      'x-component': 'Checkbox',
    },
  },

  defaultParams: (ctx) => {
    return {
      layout: 'vertical',
      labelAlign: 'left',
      labelWidth: 120,
      labelWrap: true,
      colon: true,
    };
  },
  handler(ctx, params) {
    ctx.model.setProps({ ...params, labelWidth: params.layout === 'vertical' ? null : params.labelWidth });
  },
});
