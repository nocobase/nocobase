import { merge } from '@formily/shared';
import React from 'react';
import { SchemaInitializerItem } from '../../application';

// Block
export const BlockInitializer = (props) => {
  const { item, schema, insert, ...others } = props;
  return (
    <SchemaInitializerItem
      {...others}
      onClick={() => {
        const s = merge(schema || {}, item.schema || {});
        item?.schemaInitialize?.(s);
        insert(s);
      }}
    />
  );
};
