import { merge } from '@formily/shared';
import React from 'react';

import { useCurrentSchema } from '../../../schema-initializer/utils';
import { SchemaInitializerSwitch, useSchemaInitializer } from '../../../application';

export const AssociationFilterDesignerDisplayField = (props) => {
  const { schema, item } = props;
  const { exists, remove } = useCurrentSchema(schema.name, 'name', item.find, item.remove);
  const { insert } = useSchemaInitializer();
  return (
    <SchemaInitializerSwitch
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
