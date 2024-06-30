/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ISchema } from '@nocobase/client';
import { omit } from 'lodash';

export const mobilePageNavigationBarSchema = {
  type: 'void',
  'x-component': 'MobilePageNavigationBar',
  properties: {
    actionBar: {
      type: 'void',
      'x-component': 'ActionBar',
      'x-initializer': 'mobile:navigation-bar',
      'x-component-props': {
        spaceProps: {
          style: {
            flexWrap: 'nowrap',
          },
        },
      },
      properties: {},
    },
  },
};

export const getActionBarSchemaByPosition = (
  schema: ISchema,
  position: 'left' | 'right' | 'bottom' = 'left',
  style = {},
  showInitializer = true,
) => {
  const actionBar = schema.properties['actionBar']; // 对应上面 schema 的 actionBar 结构
  return {
    ...(showInitializer ? actionBar : omit(actionBar, ['x-initializer'])),
    'x-initializer-props': {
      style,
      wrap(actionSchema: ISchema) {
        return {
          'x-position': position,
          ...actionSchema,
        };
      },
    },
    properties: Object.keys(actionBar.properties || {}).reduce((properties, key) => {
      const actionSchema = actionBar.properties[key];
      if ((actionSchema['x-position'] || 'left') === position) {
        properties[key] = actionSchema;
      }
      return properties;
    }, {}),
  };
};
