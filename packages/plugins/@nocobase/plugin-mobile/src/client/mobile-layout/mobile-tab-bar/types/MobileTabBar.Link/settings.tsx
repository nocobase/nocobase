/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SchemaSettings } from '@nocobase/client';
import { editTabItemSettingsItem, removeTabItemSettingsItem } from '../../MobileTabBar.Item';
import { generatePluginTranslationTemplate } from '../../../../locale';

export const editLinkSchema = (value?: any) => ({
  title: generatePluginTranslationTemplate('Link'),
  type: 'string',
  default: value,
  'x-decorator': 'FormItem',
  'x-component': 'Input',
  required: true,
});

export const mobileTabBarLinkSettings = new SchemaSettings({
  name: 'mobile:tab-bar:link',
  items: [
    editTabItemSettingsItem((values) => {
      return {
        link: editLinkSchema(values.link),
      };
    }),
    removeTabItemSettingsItem,
  ],
});
