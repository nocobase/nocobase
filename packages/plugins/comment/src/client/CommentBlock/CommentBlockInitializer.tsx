import { CommentOutlined } from '@ant-design/icons';
import { SchemaInitializer } from '@nocobase/client';
import React from 'react';
import { useTranslation } from 'react-i18next';

export const CommentBlockInitializer = (props) => {
  const { insert } = props;
  const { t } = useTranslation();
  return (
    <SchemaInitializer.Item
      {...props}
      icon={<CommentOutlined />}
      onClick={() => {
        insert({
          type: 'void',
          'x-designer': 'CommentBlock.Designer',
          'x-decorator': 'CommentBlock.Decorator',
          'x-component': 'CommentBlock',
          'x-component-props': {},
        });
      }}
      title={t('')}
    />
  );
};
