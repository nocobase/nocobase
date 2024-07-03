import React from 'react';
import _ from 'lodash';

import { useFieldSchema, ISchema } from '@formily/react';

function ShowSchema({ children, schemaKey }) {
  const filedSchema = useFieldSchema();
  const key = schemaKey ? `properties.schema.${schemaKey}` : `properties.schema`;
  return (
    <>
      <pre data-testid="schema-json">{JSON.stringify(_.get(filedSchema.toJSON(), key), null, 2)}</pre>
      {children}
    </>
  );
}

export function schemaViewer(schema: ISchema, schemaKey?: string) {
  return {
    type: 'void',
    name: 'schema-viewer',
    'x-component': ShowSchema,
    'x-component-props': {
      schemaKey,
    },
    properties: {
      schema,
    },
  };
}
