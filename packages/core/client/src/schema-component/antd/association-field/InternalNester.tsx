import { FormLayout } from '@formily/antd';
import { RecursionField, useField, useFieldSchema } from '@formily/react';
import React, { useEffect } from 'react';
import { CollectionProvider } from '../../../collection-manager';
import { useInsertSchema } from './hooks';
import { useCollection, useCollectionManager } from '../../../';
import schema from './schema';

export const InternalNester = () => {
  const field = useField();
  const fieldSchema = useFieldSchema();
  const insertNester = useInsertSchema('Nester');
  const { getField } = useCollection();
  const { getCollectionJoinField } = useCollectionManager();
  const collectionField = getField(fieldSchema['name']) || getCollectionJoinField(fieldSchema['x-collection-field']);
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
