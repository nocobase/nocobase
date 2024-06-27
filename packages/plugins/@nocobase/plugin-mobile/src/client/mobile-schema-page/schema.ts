/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { uid } from '@formily/shared';
import { getPageContentSchema } from '../mobile-content';

export function getMobilePageSchema(pageSchemaUId: string, firstTabSchemaUid: string) {
  const pageSchema = {
    type: 'void',
    name: pageSchemaUId,
    'x-uid': pageSchemaUId,
    'x-component': 'MobilePage',
    'x-settings': 'mobile:page',
    'x-decorator': 'BlockItem',
    'x-toolbar-props': {
      draggable: false,
    },
    properties: {
      navigationBar: {
        type: 'void',
        'x-component': 'MobileNavigationBar',
        properties: {
          leftActions: {
            type: 'void',
            'x-component': 'ActionBar',
            'x-initializer': 'mobile:navigation-bar',
            'x-initializer-props': {
              style: {
                marginLeft: 8,
              },
            },
          },
          rightActions: {
            type: 'void',
            'x-component': 'ActionBar',
            'x-initializer-props': {
              style: {
                marginRight: 15,
              },
            },
            'x-initializer': 'mobile:navigation-bar',
          },
        },
      },
      content: {
        type: 'void',
        'x-component': 'MobileContent',
        properties: {
          [firstTabSchemaUid]: getPageContentSchema(firstTabSchemaUid),
        },
      },
    },
  };

  return { schema: pageSchema };
}
