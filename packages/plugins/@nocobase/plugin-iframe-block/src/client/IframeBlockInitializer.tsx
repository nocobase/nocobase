import { FormOutlined } from '@ant-design/icons';
import { SchemaInitializerItem, useSchemaInitializerV2 } from '@nocobase/client';
import React from 'react';

export const IframeBlockInitializer = (props) => {
  const { insert } = useSchemaInitializerV2();
  return (
    <SchemaInitializerItem
      {...props}
      icon={<FormOutlined />}
      onClick={() => {
        insert({
          type: 'void',
          'x-designer': 'Iframe.Designer',
          'x-decorator': 'BlockItem',
          'x-component': 'Iframe',
          'x-component-props': {},
        });
      }}
    />
  );
};
