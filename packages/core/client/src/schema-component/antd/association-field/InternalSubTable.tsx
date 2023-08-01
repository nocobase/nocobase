import { css } from '@emotion/css';
import { FormItem, FormLayout } from '@formily/antd-v5';
import { RecursionField, observer, useField, useFieldSchema, SchemaOptionsContext } from '@formily/react';
import React, { useEffect } from 'react';
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
    useEffect(() => {
      insert(schema.SubTable);
      field.required = fieldSchema['required'];
    }, []);

    const option = useSchemaOptionsContext();
    const components = {
      ...option.components,
      FormItem: (props) => <FormItem {...props} />,
      'Radio.Group': Select,
      'Checkbox.Group': (props) => <Select multiple={true} mode="multiple" {...props} />,
    };
    return (
      <CollectionProvider name={options.target}>
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
              .ant-btn {
                border: none !important;
                box-shadow: none;
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
      </CollectionProvider>
    );
  },
  { displayName: 'InternalSubTable' },
);
