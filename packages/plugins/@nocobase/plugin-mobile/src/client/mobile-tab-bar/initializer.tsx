/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SchemaInitializer, useSchemaInitializerRender } from '@nocobase/client';
import { mobileTabBarSchemaInitializerItem } from './MobileTabBar.Schema';
import { mobileTabBarLinkInitializerItem } from './MobileTabBar.Link/initializer';

export const mobileTabBarInitializer = new SchemaInitializer({
  name: 'mobile:tab-bar',
  icon: 'PlusOutlined',
  items: [mobileTabBarSchemaInitializerItem, mobileTabBarLinkInitializerItem],
});

export const MobileTabBarInitializer = () => {
  const { render } = useSchemaInitializerRender(mobileTabBarInitializer.name);
  return render();
};
