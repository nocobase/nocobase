import { TableOutlined } from '@ant-design/icons';
import { SchemaInitializer } from '@nocobase/client';
import React from 'react';
import { useTranslation } from 'react-i18next';

export const CommentBlockInitializer = (props) => {
  const { insert } = props;
  const { t } = useTranslation('plugin-comment');
  return (
    <SchemaInitializer.Item
      {...props}
      icon={<TableOutlined />}
      onClick={() => {
        insert({
          type: 'void',
          'x-designer': 'Comment.Designer',
          'x-decorator': 'Comment.Decorator',
          'x-decorator-props': {
            params: {},
          },
          'x-component': 'CardItem',
          properties: {
            auditLogs: {
              type: 'void',
              'x-component': 'Comment',
            },
          },
        });
      }}
      title={t('Comment')}
    />
  );
};
