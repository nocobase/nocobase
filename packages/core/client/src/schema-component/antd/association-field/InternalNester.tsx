import { FormLayout } from '@formily/antd';
import { RecursionField, useField, useFieldSchema } from '@formily/react';
import React, { useEffect } from 'react';
import { CollectionProvider } from '../../../collection-manager';
import { useInsertSchema } from './hooks';
import { useAssociationFieldContext } from './hooks';
import schema from './schema';

export const InternalNester = () => {
  const field = useField();
  const fieldSchema = useFieldSchema();
  const insertNester = useInsertSchema('Nester');
  const { options: collectionField } = useAssociationFieldContext();

  useEffect(() => {
    insertNester(schema.Nester);
  }, []);
  return (
    <CollectionProvider name={collectionField.target}>
      <FormLayout layout={'vertical'}>
        <RecursionField
          onlyRenderProperties
          basePath={field.address}
          schema={fieldSchema}
          filterProperties={(s) => {
            return s['x-component'] === 'AssociationField.Nester';
          }}
        />
      </FormLayout>
    </CollectionProvider>
  );
};
