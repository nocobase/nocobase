import { FormLayout } from '@formily/antd';
import { RecursionField, useField, useFieldSchema } from '@formily/react';
import React from 'react';
import { CollectionProvider } from '../../../collection-manager';
import { useAssociationFieldContext } from './hooks';

export const InternalNester = () => {
  const field = useField();
  const fieldSchema = useFieldSchema();
  const { options } = useAssociationFieldContext();
  return (
    <CollectionProvider name={options.target}>
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
