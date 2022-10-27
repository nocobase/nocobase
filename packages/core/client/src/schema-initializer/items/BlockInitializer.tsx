import React from 'react';

import { SchemaInitializer } from "..";

// Block
export const BlockInitializer = (props) => {
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
