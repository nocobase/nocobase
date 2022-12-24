import React from 'react';
import { merge } from '@formily/shared';

import { SchemaInitializer } from '../../../schema-initializer';
import { useCurrentSchema } from '../../../schema-initializer/utils';

export const AssociationFilterDesignerDisplayField = (props) => {
  const { schema, item, insert } = props;
  const { exists, remove } = useCurrentSchema(schema.name, 'name', item.find, item.remove);
  return (
    <SchemaInitializer.SwitchItem
      checked={exists}
      title={item.title}
      onClick={() => {
        if (exists) {
          return remove();
        }
        const s = merge(schema || {}, item.schema || {});
        item?.schemaInitialize?.(s);
        insert(s);
      }}
    />
  );
};
