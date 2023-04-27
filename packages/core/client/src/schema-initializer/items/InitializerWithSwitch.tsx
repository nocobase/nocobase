import { merge } from '@formily/shared';
import React from 'react';

import { SchemaInitializer } from '..';
import { useCurrentSchema } from '../utils';
import { useBlockRequestContext } from '../../block-provider';
import { useCollection } from '../../collection-manager';

export const InitializerWithSwitch = (props) => {
  const { type, schema, item, insert, remove: passInRemove } = props;
  const { patchAppends } = useBlockRequestContext();
  const { getField } = useCollection();
  const { exists, remove } = useCurrentSchema(
    schema?.[type] || item?.schema?.[type],
    type,
    item.find,
    passInRemove ?? item.remove,
  );
  return (
    <SchemaInitializer.SwitchItem
      checked={exists}
      title={item.title}
      onClick={() => {
        const collectionField = getField(item.schema.name);
        if (['belongsTo', 'hasOne', 'hasMany', 'belongsToMany'].includes(collectionField.type)) {
          patchAppends(item.schema.name, exists ? 'remove' : 'add');
        }
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
