/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SchemaInitializer, useSchemaInitializerRender } from '@nocobase/client';
import { mobileTabBarSchemaInitializerItem, mobileTabBarLinkInitializerItem } from './types';

export const mobileTabBarInitializer = new SchemaInitializer({
  name: 'mobile:tab-bar',
  icon: 'PlusOutlined',
  style: {
    marginRight: 12,
  },
  items: [mobileTabBarSchemaInitializerItem, mobileTabBarLinkInitializerItem],
});

export const MobileTabBarInitializer = () => {
  const { render } = useSchemaInitializerRender(mobileTabBarInitializer.name);
  return render({ 'data-testid': 'schema-initializer-MobileTabBar' });
};
