import { FormOutlined } from '@ant-design/icons';
import React from 'react';
import { SchemaInitializer } from '../..';
import { createTableBlockSchema } from '../utils';

export const RecordRelationBlockInitializer = (props) => {
  const { insert } = props;
  return (
    <SchemaInitializer.Item
      {...props}
      icon={<FormOutlined />}
      onClick={({ item }) => {
        const field = item.field;
        const options = {
          collection: field.target,
          resource: `${field.collectionName}.${field.name}`,
          association: `${field.collectionName}.${field.name}`,
        };
        insert(createTableBlockSchema(options));
      }}
    />
  );
};
