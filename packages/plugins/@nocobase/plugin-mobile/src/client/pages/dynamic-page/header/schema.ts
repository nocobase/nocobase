/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { mobileNavigationBarActionsInitializer } from './navigation-bar';

export const mobilePageHeaderSchema = {
  type: 'void',
  'x-component': 'MobilePageHeader',
  properties: {
    pageNavigationBar: {
      type: 'void',
      'x-component': 'MobilePageNavigationBar',
      properties: {
        actionBar: {
          type: 'void',
          'x-component': 'MobileNavigationActionBar',
          'x-initializer': mobileNavigationBarActionsInitializer.name,
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
    },
    pageTabs: {
      type: 'void',
      'x-component': 'MobilePageTabs',
    },
  },
};
