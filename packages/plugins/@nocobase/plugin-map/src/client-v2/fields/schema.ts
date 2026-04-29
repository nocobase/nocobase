/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CollectionFieldInterface } from '@nocobase/client-v2';
import { MapTypes } from '../constants';
import { generateNTemplate } from '../locale';

export class CommonSchema extends CollectionFieldInterface {
  properties = {
    'uiSchema.x-component-props.mapType': {
      title: generateNTemplate('Map type'),
      type: 'string',
      required: true,
      'x-decorator': 'FormItem',
      'x-component': 'Select',
      'x-component-props': {
        showSearch: false,
        allowClear: false,
      },
      'x-disabled': '{{ isOverride || !createOnly }}',
      default: 'amap',
      enum: MapTypes,
    },
  };
}
