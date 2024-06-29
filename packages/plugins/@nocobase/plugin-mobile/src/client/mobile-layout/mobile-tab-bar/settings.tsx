/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SchemaSettings, createSwitchSettingsItem } from '@nocobase/client';
import { generatePluginTranslationTemplate } from '../../locale';

export const mobileTabBarSettings = new SchemaSettings({
  name: 'mobile:tab-bar',
  items: [
    createSwitchSettingsItem({
      name: 'enableTabBar',
      title: generatePluginTranslationTemplate('Enable TabBar'),
      defaultValue: true,
      schemaKey: 'x-component-props.enableTabBar',
    }),
  ],
});
