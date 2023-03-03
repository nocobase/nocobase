import { TableOutlined } from '@ant-design/icons';
import { createTableBlockSchema, SchemaInitializer } from '@nocobase/client';
import React from 'react';

export const CommentRecordInitializer = (props) => {
  const { insert } = props;
  const schema = createTableBlockSchema({
    collection: 'comments',
    rowKey: 'id',
    tableActionInitializers: 'CommentRecordTableActionInitializers',
    tableColumnInitializers: 'CommentRecordTableColumnInitializers',
    tableActionColumnInitializers: 'CommentRecordTableActionColumnInitializers',
    tableBlockProvider: 'CommentRecordBlockProvider',
    disableTemplate: true,
  });

  return (
    <SchemaInitializer.Item
      {...props}
      icon={<TableOutlined />}
      onClick={() => {
        insert(schema);
      }}
    />
  );
};
