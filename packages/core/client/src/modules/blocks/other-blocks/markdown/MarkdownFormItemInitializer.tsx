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
          // 'x-designer': 'Markdown.Void.Designer',
          'x-toolbar': 'BlockSchemaToolbar',
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
