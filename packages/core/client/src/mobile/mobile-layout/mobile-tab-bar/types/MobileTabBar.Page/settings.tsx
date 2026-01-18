/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SchemaSettings } from '../../../../schema-component';
import { editTabItemSettingsItem, removeTabItemSettingsItem } from '../../MobileTabBar.Item';

export const mobileTabBarPageSettings = new SchemaSettings({
  name: 'mobile:tab-bar:page',
  items: [
    editTabItemSettingsItem(),
    {
      name: 'divider',
      type: 'divider',
    },
    removeTabItemSettingsItem,
  ],
});
