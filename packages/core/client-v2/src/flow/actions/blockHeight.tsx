/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineAction, tExpr } from '@nocobase/flow-engine';
import { InputNumber } from 'antd';
import _ from 'lodash';

const HeightMode = {
  DEFAULT: 'defaultHeight',
  SPECIFY_VALUE: 'specifyValue',
  FULL_HEIGHT: 'fullHeight',
};

export const blockHeight = defineAction({
  name: 'blockHeight',
  title: tExpr('Block height'),
  uiMode: {
    type: 'dialog',
  },
  uiSchema: (ctx) => {
    const { t } = ctx;
    return {
      heightMode: {
        type: 'string',
        enum: [
          { label: t('Default'), value: HeightMode.DEFAULT },
          { label: t('Specify height'), value: HeightMode.SPECIFY_VALUE },
          { label: t('Full height'), value: HeightMode.FULL_HEIGHT },
        ],
        required: true,
        'x-decorator': 'FormItem',
        'x-component': 'Radio.Group',
      },
      height: {
        title: t('Height'),
        type: 'number',
        required: true,
        'x-decorator': 'FormItem',
        'x-component': InputNumber,
        'x-component-props': {
          addonAfter: 'px',
        },
        'x-validator': [
          {
            minimum: 40,
          },
        ],
        'x-reactions': {
          dependencies: ['heightMode'],
          fulfill: {
            state: {
              hidden: '{{ $deps[0]==="fullHeight"||$deps[0]==="defaultHeight"}}',
              value: '{{$deps[0]!=="specifyValue"?null:$self.value}}',
            },
          },
        },
      },
    };
  },
  defaultParams(ctx) {
    return {
      heightMode: HeightMode.DEFAULT,
    };
  },
  async handler(ctx, params) {
    ctx.model.setDecoratorProps({
      heightMode: params.heightMode,
      height: params.height,
    });
  },
});
