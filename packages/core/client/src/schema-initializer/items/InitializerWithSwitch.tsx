import { merge } from '@formily/shared';
import React from 'react';

import { useCurrentSchema } from '../utils';
import { SchemaInitializerSwitch } from '../../application';

export const InitializerWithSwitch = (props) => {
  const { type, schema, item, insert, remove: passInRemove, disabled } = props;
  const { exists, remove } = useCurrentSchema(
    schema?.[type] || item?.schema?.[type],
    type,
    item.find,
    passInRemove ?? item.remove,
  );

  return (
    <SchemaInitializerSwitch
      checked={exists}
      disabled={disabled}
      title={item.title}
      onClick={() => {
        if (disabled) {
          return;
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
