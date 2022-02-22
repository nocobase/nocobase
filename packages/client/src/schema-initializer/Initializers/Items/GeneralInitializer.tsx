import React from 'react';
import { SchemaInitializer } from '../../SchemaInitializer';

export const GeneralInitializer = (props) => {
  const { item, insert } = props;
  return (
    <SchemaInitializer.Item
      onClick={() => {
        insert({
          ...item.schema,
        });
      }}
    />
  );
};
