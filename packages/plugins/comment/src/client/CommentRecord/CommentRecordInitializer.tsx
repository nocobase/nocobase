import { TableOutlined } from '@ant-design/icons';
import { SchemaInitializer } from '@nocobase/client';
import React from 'react';
import { useTranslation } from 'react-i18next';

export const CommentRecordInitializer = (props) => {
  const { insert } = props;
  return (
    <SchemaInitializer.Item
      {...props}
      icon={<TableOutlined />}
      onClick={() => {
        insert({
          type: 'void',
          'x-designer': 'CommentRecord.Designer',
          'x-decorator': 'CommentRecord.Decorator',
          'x-decorator-props': {
            params: {},
          },
          'x-component': 'CardItem',
          properties: {
            auditLogs: {
              type: 'void',
              'x-component': 'CommentRecord',
            },
          },
        });
      }}
    />
  );
};
