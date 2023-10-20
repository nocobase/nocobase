import React, { FC } from 'react';
import { TableOutlined } from '@ant-design/icons';

import { SchemaInitializer, useSchemaInitializerV2 } from '@nocobase/client';

export const WorkflowTodoBlockInitializer: FC<any> = ({ ...rest }) => {
  const { insert } = useSchemaInitializerV2();
  return (
    <SchemaInitializer.Item
      icon={<TableOutlined />}
      {...rest}
      onClick={() => {
        insert({
          type: 'void',
          'x-decorator': 'WorkflowTodo.Decorator',
          'x-decorator-props': {},
          'x-component': 'CardItem',
          'x-designer': 'TableBlockDesigner',
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
