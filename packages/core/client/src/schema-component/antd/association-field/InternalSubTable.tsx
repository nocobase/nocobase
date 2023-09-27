import { css } from '@emotion/css';
import { FormLayout } from '@formily/antd-v5';
import { RecursionField, SchemaOptionsContext, observer, useField, useFieldSchema } from '@formily/react';
import React, { useEffect } from 'react';
import { ACLCollectionProvider, useACLActionParamsContext } from '../../../acl';
import { CollectionProvider } from '../../../collection-manager';
import { useSchemaOptionsContext } from '../../../schema-component';
import Select from '../select/Select';
import { useAssociationFieldContext, useInsertSchema } from './hooks';
import schema from './schema';

export const InternalSubTable = observer(
  () => {
    const field: any = useField();
    const fieldSchema = useFieldSchema();
    const insert = useInsertSchema('SubTable');
    const { options } = useAssociationFieldContext();
    const { actionName } = useACLActionParamsContext();
    useEffect(() => {
      insert(schema.SubTable);
      field.required = fieldSchema['required'];
    }, []);

    const option = useSchemaOptionsContext();
    const components = {
      ...option.components,
      'Radio.Group': (props) => <Select data-testid="antd-select" {...props} />,
      'Checkbox.Group': (props) => <Select data-testid="antd-select" multiple={true} mode="multiple" {...props} />,
    };
    return (
      <CollectionProvider name={options.target}>
        <ACLCollectionProvider actionPath={`${options.target}:${actionName}`}>
          <FormLayout
            className={css`
              .ant-formily-item-bordered-none {
                .ant-input-number-group-addon {
                  border: none !important;
                  background: none;
                }
                .ant-checkbox-wrapper {
                  margin-left: 8px;
                }
                .ant-table {
                  margin: 0px !important;
                }
              }
            `}
            layout={'vertical'}
            bordered={false}
          >
            <SchemaOptionsContext.Provider
              value={{
                scope: option.scope,
                components,
              }}
            >
              <RecursionField
                onlyRenderProperties
                basePath={field.address}
                schema={fieldSchema}
                filterProperties={(s) => {
                  return s['x-component'] === 'AssociationField.SubTable';
                }}
              />
            </SchemaOptionsContext.Provider>
          </FormLayout>
        </ACLCollectionProvider>
      </CollectionProvider>
    );
  },
  { displayName: 'InternalSubTable' },
);
