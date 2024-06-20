/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SchemaSettings, createModalSettingsItem } from '@nocobase/client';
import { editTabItemSettingsItem, useUpdateTabBarItem } from '../MobileTabBar.Item';
import { generatePluginTranslationTemplate } from '../../locale';

export const editLinkSchema = {
  title: generatePluginTranslationTemplate('Link'),
  type: 'string',
  'x-decorator': 'FormItem',
  'x-component': 'Input',
  required: true,
};

export const mobileTabBarLinkSettings = new SchemaSettings({
  name: 'mobile:tab-bar:link',
  items: [
    editTabItemSettingsItem,
    createModalSettingsItem({
      title: generatePluginTranslationTemplate('Edit link'),
      name: 'link',
      parentSchemaKey: 'x-component-props',
      width: '90%',
      schema: (values) => ({
        type: 'object',
        title: 'Edit Link',
        default: values,
        properties: {
          url: editLinkSchema,
        },
      }),
      useSubmit: useUpdateTabBarItem,
    }),
  ],
});
