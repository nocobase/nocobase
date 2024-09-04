/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FormOutlined } from '@ant-design/icons';
import React from 'react';
import { SchemaInitializerItem, useSchemaInitializer, useSchemaInitializerItem } from '../../../../application';

export const MarkdownFormItemInitializer = () => {
  const { insert } = useSchemaInitializer();
  const itemConfig = useSchemaInitializerItem();
  return (
    <SchemaInitializerItem
      {...itemConfig}
      icon={<FormOutlined />}
      onClick={() => {
        insert({
          type: 'void',
          'x-editable': false,
          'x-decorator': 'FormItem',
          'x-decorator-props': {
            engine: 'handlebars',
          },
          // 'x-designer': 'Markdown.Void.Designer',
          'x-toolbar': 'FormItemSchemaToolbar',
          'x-settings': 'blockSettings:markdown',
          'x-component': 'Markdown.Void',
          'x-component-props': {
            content: '{{t("This is a demo text, **supports Markdown syntax**.")}}',
          },
        });
      }}
    />
  );
};
