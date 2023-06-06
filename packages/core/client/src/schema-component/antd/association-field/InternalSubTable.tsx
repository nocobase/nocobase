import { FormLayout, FormItem } from '@formily/antd';
import { RecursionField, useField, useFieldSchema } from '@formily/react';
import React, { useEffect } from 'react';
import { CollectionProvider } from '../../../collection-manager';
import { useAssociationFieldContext, useInsertSchema } from './hooks';
import schema from './schema';

export const InternalSubTable = () => {
  const field: any = useField();
  const fieldSchema = useFieldSchema();
  const insert = useInsertSchema('SubTable');
  const { options } = useAssociationFieldContext();
  useEffect(() => {
    insert(schema.SubTable);
    field.required = fieldSchema['required'];
  }, []);
  return (
    <CollectionProvider name={options.target}>
      <FormLayout layout={'vertical'}>
        <RecursionField
          onlyRenderProperties
          basePath={field.address}
          schema={fieldSchema}
          filterProperties={(s) => {
            return s['x-component'] === 'AssociationField.SubTable';
          }}
        />
      </FormLayout>
    </CollectionProvider>
  );
};
