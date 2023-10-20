import { FormOutlined } from '@ant-design/icons';
import { InitializerItem } from '@nocobase/client';
import React from 'react';

export const IframeBlockInitializer = (props) => {
  const { insert } = props;
  return (
    <InitializerItem
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
