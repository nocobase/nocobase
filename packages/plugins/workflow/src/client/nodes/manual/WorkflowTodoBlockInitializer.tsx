import { TableOutlined } from '@ant-design/icons';
import { SchemaInitializer } from '@nocobase/client';
import React, { FC } from 'react';

export const WorkflowTodoBlockInitializer: FC<any> = ({ insert, ...rest }) => {
  return (
    <SchemaInitializer.Item
      icon={<TableOutlined />}
      {...rest}
      onClick={() => {
        insert({
          type: 'void',
          'x-component': 'WorkflowTodo',
          // // 'x-decorator': 'WorkflowTodo.Decorator',
          // // 'x-decorator-props': {},
          // 'x-component': 'CardItem',
          // 'x-designer': 'TableBlockDesigner',
          // properties: {
          //   todos: {
          //     type: 'void',
          //     'x-component': 'WorkflowTodo',
          //   },
          // },
        });
      }}
    />
  );
};
