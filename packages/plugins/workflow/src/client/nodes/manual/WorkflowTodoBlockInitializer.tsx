import React from 'react';
import { TableOutlined } from '@ant-design/icons';

import { SchemaInitializer, useCollectionManager } from "@nocobase/client";



export function WorkflowTodoBlockInitializer({ insert, ...props }) {
  const { collections, ...ctx } = useCollectionManager();
  return (
    <SchemaInitializer.Item
      icon={<TableOutlined />}
      {...props}
      onClick={() => {
        insert({
          type: 'void',
          'x-decorator': 'WorkflowTodo.Decorator',
          'x-decorator-props': {
          },
          'x-component': 'CardItem',
          'x-designer': 'TableBlockDesigner',
          properties: {
            todos: {
              type: 'void',
              'x-component': 'WorkflowTodo'
            },
          }
        });
      }}
    />
  );
}
