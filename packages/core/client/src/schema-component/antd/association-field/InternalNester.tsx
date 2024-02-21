import { css, cx } from '@emotion/css';
import { FormLayout } from '@formily/antd-v5';
import { RecursionField, useField, useFieldSchema, observer } from '@formily/react';
import React, { useEffect } from 'react';
import { CollectionProvider_deprecated } from '../../../collection-manager';
import { useAssociationFieldContext, useInsertSchema } from './hooks';
import { ACLCollectionProvider, useACLActionParamsContext } from '../../../acl';
import schema from './schema';

export const InternalNester = observer(
  () => {
    const field = useField();
    const fieldSchema = useFieldSchema();
    const insertNester = useInsertSchema('Nester');
    const { options: collectionField } = useAssociationFieldContext();
    const showTitle = fieldSchema['x-decorator-props']?.showTitle ?? true;
    const { actionName } = useACLActionParamsContext();
    useEffect(() => {
      insertNester(schema.Nester);
    }, []);
    return (
      <CollectionProvider_deprecated name={collectionField.target}>
        <ACLCollectionProvider actionPath={`${collectionField.target}:${actionName}`}>
          <FormLayout layout={'vertical'}>
            <div
              className={cx(
                css`
                  & .ant-formily-item-layout-vertical {
                    margin-bottom: 10px;
                  }
                  .ant-card-body {
                    padding: 15px 20px 5px;
                  }
                  .ant-divider-horizontal {
                    margin: 10px 0;
                  }
                `,
                {
                  [css`
                    .ant-card-body {
                      padding: 0px 20px 20px 0px;
                    }
                    > .ant-card-bordered {
                      border: none;
                    }
                  `]: showTitle === false,
                },
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
        </ACLCollectionProvider>
      </CollectionProvider_deprecated>
    );
  },
  { displayName: 'InternalNester' },
);
