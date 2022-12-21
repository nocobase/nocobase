import React from 'react';
import { merge } from '@formily/shared';

import { SchemaInitializer } from '..';
import { useCurrentSchema } from '../utils';

export const AssociationFieldsFilterActionInitializerItem = (props) => {
  const { collectionFieldKey, schema, item, insert } = props;
  const { exists, remove } = useCurrentSchema(collectionFieldKey, 'x-collection-fieldKey', item.find, item.remove);
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
