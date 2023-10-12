import React from 'react';

import { useCurrentSchema } from '../utils';
import { InitializerSwitch } from '../../application';

export const InitializerWithSwitch = (props) => {
  const { type, schema, title, schemaInitialize, find, insert, remove: passInRemove } = props;
  const { exists, remove } = useCurrentSchema(schema?.[type], type, find, passInRemove);

  return (
    <InitializerSwitch
      checked={exists}
      title={title}
      onClick={() => {
        if (exists) {
          return remove();
        }
        schemaInitialize?.(schema);
        insert(schema);
      }}
    />
  );
};
