/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CollectionFieldInterface, type FieldInterfaceConfigure } from '@nocobase/client-v2';
import { MapTypes } from '../constants';
import { tExpr } from '../locale';

export class CommonMapFieldInterface extends CollectionFieldInterface {
  type = 'object';
  group = 'map';
  sortable = true;
  titleUsable = false;
  availableTypes = ['json'];
  configure: FieldInterfaceConfigure = {
    items: [
      {
        name: 'uiSchema.x-component-props.mapType',
        title: tExpr('Map type'),
        component: 'Select',
        required: true,
        disabled: ({ context }) => !context.createOnly,
        defaultValue: 'amap',
        componentProps: {
          showSearch: false,
          allowClear: false,
        },
        options: MapTypes,
      },
    ],
  };

  protected createDefault(type: string) {
    return {
      interface: type,
      type,
      uiSchema: {
        type: 'void',
        'x-component': 'Map',
        'x-component-designer': 'Map.Designer',
        'x-component-props': {},
      },
    };
  }
}
