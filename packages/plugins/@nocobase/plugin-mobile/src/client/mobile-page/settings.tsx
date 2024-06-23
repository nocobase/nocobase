/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SchemaSettings, createSwitchSettingsItem } from '@nocobase/client';
import { generatePluginTranslationTemplate } from '../locale';

export const mobilePageSettings = new SchemaSettings({
  name: 'mobile:page',
  items: [
    createSwitchSettingsItem({
      name: 'enableNavigationBar',
      title: generatePluginTranslationTemplate('Enable Navigation Bar'),
      defaultValue: true,
      schemaKey: 'x-component-props.enableNavigationBar',
    }),
    createSwitchSettingsItem({
      name: 'enableNavigationBarTitle',
      title: generatePluginTranslationTemplate('Enable Navigation Bar Title'),
      defaultValue: true,
      schemaKey: 'x-component-props.enableNavigationBarTitle',
    }),
    createSwitchSettingsItem({
      name: 'enableNavigationBarTabs',
      title: generatePluginTranslationTemplate('Enable Navigation Bar Tabs'),
      defaultValue: false,
      schemaKey: 'x-component-props.enableNavigationBarTabs',
    }),
  ],
});
