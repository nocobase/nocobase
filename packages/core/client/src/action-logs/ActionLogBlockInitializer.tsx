import { TableOutlined } from '@ant-design/icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { SchemaInitializer } from '../schema-initializer';

export const ActionLogBlockInitializer = (props) => {
  const { insert } = props;
  const { t } = useTranslation();
  return (
    <SchemaInitializer.Item
      {...props}
      icon={<TableOutlined />}
      onClick={({ item }) => {
        insert({ type: 'void', 'x-component': 'ActionLog', 'x-component-props': {} });
      }}
      items={[
        {
          type: 'item',
          name: 'ActionLog',
          title: t('Action Logs'),
        },
      ]}
    />
  );
};
