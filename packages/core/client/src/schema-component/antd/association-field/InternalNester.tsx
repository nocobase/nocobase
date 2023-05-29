import { FormLayout } from '@formily/antd';
import { RecursionField, useField, useFieldSchema } from '@formily/react';
import React, { useEffect } from 'react';
import { css, cx } from '@emotion/css';
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
        <div
          className={cx(
            css`
              & .ant-formily-item-layout-vertical {
                margin-bottom: 10px;
              }
              .ant-card-body {
                padding: 15px 20px ;
              }
              .ant-divider-horizontal{
                margin:10px 0
              }
            `,
          )}
        >
          <RecursionField
            onlyRenderProperties
            basePath={field.address}
            schema={fieldSchema}
            filterProperties={(s) => {
              return s['x-component'] === 'AssociationField.Nester';
            }}
          />
        </div>
      </FormLayout>
    </CollectionProvider>
  );
};
