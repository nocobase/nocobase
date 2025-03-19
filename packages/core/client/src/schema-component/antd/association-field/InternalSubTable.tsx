/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css } from '@emotion/css';
import { FormLayout } from '@formily/antd-v5';
import { SchemaOptionsContext, observer, useField, useFieldSchema } from '@formily/react';
import React, { useEffect } from 'react';
import { ACLCollectionProvider, useACLActionParamsContext } from '../../../acl';
import { CollectionProvider_deprecated } from '../../../collection-manager';
import { NocoBaseRecursionField } from '../../../formily/NocoBaseRecursionField';
import { FormItem, useSchemaOptionsContext } from '../../../schema-component';
import Select from '../select/Select';
import { useAssociationFieldContext, useInsertSchema } from './hooks';
import schema from './schema';

export const InternalSubTable = observer(
  () => {
    const field: any = useField();
    const fieldSchema = useFieldSchema();
    const insert = useInsertSchema('SubTable');
    const insertSelector = useInsertSchema('Selector');
    const { options } = useAssociationFieldContext();
    const { actionName } = useACLActionParamsContext();
    useEffect(() => {
      insert(schema.SubTable);
      field.required = fieldSchema['required'];
    }, []);
    useEffect(() => {
      if (field.componentProps?.allowSelectExistingRecord) {
        insertSelector(schema.Selector);
      }
    }, [field.componentProps?.allowSelectExistingRecord]);

    const option = useSchemaOptionsContext();
    const components = {
      ...option.components,
      FormItem,
      'Radio.Group': Select,
      'Checkbox.Group': (props) => <Select multiple={true} mode="multiple" {...props} />,
    };
    return (
      <CollectionProvider_deprecated name={options.target}>
        <ACLCollectionProvider actionPath={`${options.target}:${actionName || 'view'}`}>
          <FormLayout
            className={css`
              .ant-formily-item-bordered-none {
                .ant-input-number-group-addon {
                  border: none !important;
                  background: none;
                }
                .ant-table {
                  margin: 0px !important;
                }
              }
              .ant-table-body {
                max-height: 100% !important;
                min-height: 100% !important;
              }

              // configure columns
              .ant-table-thead
                button[aria-label*='schema-initializer-AssociationField.SubTable-table:configureColumns']
                > span:last-child {
                display: none !important;
              }
              .ant-table-thead
                button[aria-label*='schema-initializer-AssociationField.SubTable-table:configureColumns']
                > .ant-btn-icon {
                margin: 0px;
              }
              .ant-table-tbody .nb-column-initializer {
                min-width: 40px !important;
              }
            `}
            layout={'vertical'}
            bordered={false}
            feedbackLayout="popover"
          >
            <SchemaOptionsContext.Provider
              value={{
                scope: option.scope,
                components,
              }}
            >
              <NocoBaseRecursionField
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
      </CollectionProvider_deprecated>
    );
  },
  { displayName: 'InternalSubTable' },
);
