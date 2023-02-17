import { TableOutlined } from '@ant-design/icons';
import { SchemaInitializer } from '@nocobase/client';
import React from 'react';
import { useCommentRecordSchema } from './CommentRecord';

export const CommentRecordInitializer = (props) => {
  const { insert } = props;
  const schema = useCommentRecordSchema();

  return (
    <SchemaInitializer.Item
      {...props}
      icon={<TableOutlined />}
      onClick={() => {
        insert({
          type: 'void',
          'x-designer': 'CommentRecordDesigner',
          'x-decorator': 'CommentRecordDecorator',
          'x-decorator-props': {
            params: {},
          },
          'x-component': 'CardItem',
          properties: {
            commentRecords: schema,
          },
        });
      }}
    />
  );
};
