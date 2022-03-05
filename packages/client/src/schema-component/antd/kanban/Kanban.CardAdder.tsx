import { PlusOutlined } from '@ant-design/icons';
import { observer, useFieldSchema } from '@formily/react';
import { uid } from '@formily/shared';
import React, { useState } from 'react';
import { SchemaComponent } from '../..';

export const KanbanCardAdder = observer((props: any) => {
  const [visible, setVisible] = useState(false);
  const fieldSchema = useFieldSchema();
  const actionSchema = {
    type: 'void',
    'x-component': 'Action',
    'x-component-props': {
      icon: <PlusOutlined />,
      block: true,
    },
    title: '添加',
    properties: fieldSchema.toJSON().properties,
  };
  return <SchemaComponent memoized name={uid()} schema={actionSchema as any} />;
});
