/**
 * defaultShowCode: true
 */
import {
  Grid,
  SchemaInitializer,
  Application,
  SchemaInitializerSwitch,
  useCurrentSchema,
  useSchemaInitializer,
  Action,
} from '@nocobase/client';
import React from 'react';
import { appOptions } from './schema-initializer-common';

const actionKey = 'x-action';

const schema = {
  type: 'void',
  [actionKey]: 'create',
  title: "{{t('Add new')}}",
  'x-component': 'Action',
  'x-component-props': {
    type: 'primary',
  },
};

const AddNewButton = () => {
  // 判断是否已插入
  const { exists, remove } = useCurrentSchema(schema[actionKey], actionKey);

  const { insert } = useSchemaInitializer();
  return (
    <SchemaInitializerSwitch
      checked={exists}
      title={'Add new - Component方式'}
      onClick={() => {
        // 如果已插入，则移除
        if (exists) {
          return remove();
        }
        // 新插入子节点
        insert(schema);
      }}
    />
  );
};

const myInitializer = new SchemaInitializer({
  name: 'MyInitializer',
  title: 'Configure actions',
  wrap: Grid.wrap,
  items: [
    {
      name: 'Add New',
      Component: AddNewButton,
    },
    {
      name: 'Add New2',
      type: 'switch',
      useComponentProps() {
        const { exists, remove } = useCurrentSchema(schema[actionKey], actionKey);

        const { insert } = useSchemaInitializer();
        return {
          checked: exists,
          title: 'Add new - type 方式',
          onClick() {
            // 如果已插入，则移除
            if (exists) {
              return remove();
            }
            // 新插入子节点
            insert(schema);
          },
        };
      },
    },
  ],
});

const app = new Application({
  ...appOptions,
  schemaInitializers: [myInitializer],
  components: { Action },
});

export default app.getRootComponent();
