/**
 * defaultShowCode: true
 */
import { ISchema } from '@formily/react';
import {
  Application,
  FormItem,
  Input,
  SchemaSettings,
  SchemaSettingsModalItem,
  useSchemaSettings,
} from '@nocobase/client';
import React from 'react';
import { appOptions } from './schema-settings-common';

export const SchemaSettingsBlockTitleItem = function BlockTitleItem() {
  const { dn } = useSchemaSettings();

  return (
    <SchemaSettingsModalItem
      title={'Edit block title'}
      schema={
        {
          type: 'object',
          title: 'Edit block title',
          properties: {
            title: {
              title: 'Block title',
              type: 'string',
              default: dn.getSchemaAttribute('x-decorator-props.title'),
              'x-decorator': 'FormItem',
              'x-component': 'Input',
              'x-compile-omitted': ['default'],
            },
          },
        } as ISchema
      }
      onSubmit={({ title }) => {
        dn.deepMerge({
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
