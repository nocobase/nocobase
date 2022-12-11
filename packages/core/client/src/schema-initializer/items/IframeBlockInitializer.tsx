import { FormOutlined } from '@ant-design/icons';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { SchemaInitializer } from '../SchemaInitializer';

export const IframeBlockInitializer = (props) => {
  const { insert } = props;
  const { t } = useTranslation();
  return (
    <SchemaInitializer.Item
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
