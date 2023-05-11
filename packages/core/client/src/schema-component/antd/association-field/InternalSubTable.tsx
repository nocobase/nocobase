import { FormLayout } from '@formily/antd';
import { RecursionField, useField, useFieldSchema } from '@formily/react';
import React, { useEffect } from 'react';
import { CollectionProvider } from '../../../collection-manager';
import { useAssociationFieldContext, useInsertSchema } from './hooks';
import schema from './schema';

export const InternalSubTable = () => {
  const field = useField();
  const fieldSchema = useFieldSchema();
  const insert = useInsertSchema('SubTable');
  const { options } = useAssociationFieldContext();
  useEffect(() => {
    insert(schema.SubTable);
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
