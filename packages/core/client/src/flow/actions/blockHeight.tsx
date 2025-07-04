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
import { HeightMode } from '../internal/constants/HeightMode';

export const blockHeight = defineAction({
  name: 'blockHeight',
  title: tval('Set block height'),
  uiSchema: {
    heightMode: {
      type: 'string',
      enum: [
        { label: tval('Default'), value: HeightMode.DEFAULT },
        { label: tval('Specify height'), value: HeightMode.SPECIFY_VALUE },
        // { label: tval('Full height'), value: HeightMode.FULL_HEIGHT },
      ],
      required: true,
      'x-decorator': 'FormItem',
      'x-component': 'Radio.Group',
    },
    height: {
      title: tval('Height'),
      type: 'string',
      required: true,
      'x-decorator': 'FormItem',
      'x-component': 'NumberPicker',
      'x-component-props': {
        addonAfter: 'px',
      },
      'x-validator': [
        {
          minimum: 200,
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
  },
  defaultParams: () => {
    return {
      heightMode: HeightMode.DEFAULT,
    };
  },
  handler(ctx: any, params) {
    ctx.model.setDecoratorProps({ heightMode: params.heightMode, height: params.height });
  },
});
