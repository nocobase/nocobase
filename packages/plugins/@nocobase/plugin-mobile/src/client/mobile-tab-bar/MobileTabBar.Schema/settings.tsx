/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SchemaSettings } from '@nocobase/client';
import { editTabItemSettingsItem, removeTabItemSettingsItem } from '../MobileTabBar.Item';

export const mobileTabBarSchemaSettings = new SchemaSettings({
  name: 'mobile:tab-bar:schema',
  items: [editTabItemSettingsItem(), removeTabItemSettingsItem],
});
