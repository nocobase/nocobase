/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CompatibleSchemaInitializer, gridRowColWrap } from '@nocobase/client';
import { useCustomBulkEditFormItemInitializerFields } from './utils';

const commonOptions = {
  wrap: gridRowColWrap,
  icon: 'SettingOutlined',
  title: '{{t("Configure fields")}}',
  items: [
    {
      name: 'displayFields',
      type: 'itemGroup',
      title: '{{t("Display fields")}}',
      useChildren: useCustomBulkEditFormItemInitializerFields,
    },
    {
      name: 'divider',
      type: 'divider',
    },
    {
      name: 'addText',
      title: '{{t("Add Markdown")}}',
      Component: 'BlockItemInitializer',
      schema: {
        type: 'void',
        'x-editable': false,
        'x-decorator': 'FormItem',
        // 'x-designer': 'Markdown.Void.Designer',
        'x-toolbar': 'FormItemSchemaToolbar',
        'x-settings': 'blockSettings:markdown',
        'x-component': 'Markdown.Void',
        'x-component-props': {
          content: '{{t("This is a demo text, **supports Markdown syntax**.")}}',
        },
      },
    },
  ],
};

/**
 * @deprecated
 * use `bulkEditFormItemInitializers` instead
 */
export const BulkEditFormItemInitializers_deprecated = new CompatibleSchemaInitializer({
  name: 'BulkEditFormItemInitializers',
  ...commonOptions,
});

export const bulkEditFormItemInitializers = new CompatibleSchemaInitializer(
  {
    name: 'bulkEditForm:configureFields',
    ...commonOptions,
  },
  BulkEditFormItemInitializers_deprecated,
);
