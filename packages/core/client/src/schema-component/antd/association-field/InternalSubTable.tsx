import { Field } from '@formily/core';
import { observer, useField, useFieldSchema, RecursionField } from '@formily/react';
import React, { useEffect } from 'react';
import { useInsertSchema } from './hooks';
import schema from './schema';

export const InternalSubTable: any = observer((props: any) => {
  const fieldSchema = useFieldSchema();
  const field: any = useField<Field>();
  const insertSubTable = useInsertSchema('SubTable');
  useEffect(() => {
    insertSubTable(schema.SubTable);
  }, []);
  return (
    <div>
      <RecursionField
        onlyRenderProperties
        basePath={field.address}
        schema={fieldSchema}
        filterProperties={(s) => {
          return s['x-component'] === 'AssociationField.SubTable';
        }}
      />
    </div>
  );
});
