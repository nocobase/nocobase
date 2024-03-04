import { TableOutlined } from '@ant-design/icons';
import React, { FC } from 'react';

import { SchemaInitializerItem, useSchemaInitializer, useSchemaInitializerItem } from '@nocobase/client';

export const WorkflowTodoBlockInitializer: FC<any> = () => {
  const itemConfig = useSchemaInitializerItem();
  const { insert } = useSchemaInitializer();
  return (
    <SchemaInitializerItem
      icon={<TableOutlined />}
      {...itemConfig}
      onClick={() => {
        insert({
          type: 'void',
          'x-decorator': 'WorkflowTodo.Decorator',
          'x-decorator-props': {},
          'x-component': 'CardItem',
          // 'x-designer': 'TableBlockDesigner',
          'x-toolbar': 'BlockSchemaToolbar',
          'x-settings': 'blockSettings:table',
          properties: {
            todos: {
              type: 'void',
              'x-component': 'WorkflowTodo',
            },
          },
        });
      }}
    />
  );
};
