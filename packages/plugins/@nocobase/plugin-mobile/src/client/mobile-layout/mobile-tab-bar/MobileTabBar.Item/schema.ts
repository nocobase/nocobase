/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { upperFirst } from 'lodash';
import { merge } from '@nocobase/utils/client';
import { ISchema } from '@nocobase/client';
import { MobileRouteItem } from '../../../mobile-providers';

export function getMobileTabBarItemSchema(routeItem: MobileRouteItem) {
  const _schema = {
    name: routeItem.id,
    type: 'void',
    'x-decorator': 'BlockItem',
    'x-settings': `mobile:tab-bar:${routeItem.type}`,
    'x-component': `MobileTabBar.${upperFirst(routeItem.type)}`,
    'x-toolbar-props': {
      showBorder: false,
      showBackground: true,
    },
    'x-component-props': {
      title: routeItem.title,
      icon: routeItem.icon,
      schemaUid: routeItem.schemaUid,
      ...(routeItem.options || {}),
    },
  };
  return merge(_schema, routeItem.options?.schema ?? {}) as ISchema;
}
