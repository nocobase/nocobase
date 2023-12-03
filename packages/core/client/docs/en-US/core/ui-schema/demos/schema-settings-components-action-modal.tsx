/**
 * defaultShowCode: true
 */
import React from 'react';
import {
  Application,
  FormItem,
  Input,
  SchemaSettings,
  SchemaSettingsActionModalItem,
  useDesignable,
} from '@nocobase/client';
import { appOptions } from './schema-settings-common';
import { ISchema, useField } from '@formily/react';

export const SchemaSettingsBlockTitleItem = function BlockTitleItem() {
  const filed = useField();
  const { patch } = useDesignable();

  return (
    <SchemaSettingsActionModalItem
      title={'Edit block title'}
      schema={
        {
          type: 'object',
          title: 'Edit block title',
          properties: {
            title: {
              title: 'Block title',
              type: 'string',
              default: filed.decoratorProps?.title,
              'x-decorator': 'FormItem',
              'x-component': 'Input',
            },
          },
        } as ISchema
      }
      onSubmit={({ title }) => {
        patch({
          'x-decorator-props': {
            title,
          },
        });
      }}
    />
  );
};

const mySettings = new SchemaSettings({
  name: 'mySettings',
  items: [
    {
      name: 'blockTitle',
      Component: SchemaSettingsBlockTitleItem,
    },
  ],
});

const app = new Application({
  ...appOptions,
  schemaSettings: [mySettings],
});

app.addComponents({ FormItem, Input });

export default app.getRootComponent();
