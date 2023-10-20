import { merge } from '@formily/shared';
import React from 'react';
import { SchemaInitializerItem, useSchemaInitializerV2 } from '../../application';

// Block
export const BlockInitializer = (props) => {
  const { item, schema, ...others } = props;
  const { insert } = useSchemaInitializerV2();
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
