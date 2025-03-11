/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css, cx } from '@emotion/css';
import { FormLayout } from '@formily/antd-v5';
import { observer, useField, useFieldSchema } from '@formily/react';
import { theme } from 'antd';
import React, { useEffect } from 'react';
import { ACLCollectionProvider, useACLActionParamsContext } from '../../../acl';
import { CollectionProvider_deprecated } from '../../../collection-manager';
import { NocoBaseRecursionField } from '../../../formily/NocoBaseRecursionField';
import { useAssociationFieldContext, useInsertSchema } from './hooks';
import schema from './schema';

const InternalNesterCardCss = css`
  .ant-card-bordered {
    border: none;
  }
  .ant-card-body {
    padding: 0px 20px 0px 0px;
  }
`;

export const InternalNester = observer(
  () => {
    const field = useField();
    const fieldSchema = useFieldSchema();
    const insertNester = useInsertSchema('Nester');
    const insertSelector = useInsertSchema('Selector');
    const { options: collectionField } = useAssociationFieldContext();
    const showTitle = fieldSchema['x-decorator-props']?.showTitle ?? true;
    const { actionName } = useACLActionParamsContext();
    const { token } = theme.useToken();
    const {
      layout = 'vertical',
      labelAlign = 'left',
      labelWidth = 120,
      labelWrap = true,
    } = fieldSchema?.['x-component-props'] || {};

    const InternalNesterCss = css`
      margin-top: 0.4em;

      & .ant-formily-item-layout-vertical {
        margin-bottom: 10px;
      }
      .ant-card-body {
        padding: ${token.padding}px ${token.paddingLG}px;
      }
      .ant-divider-horizontal {
        margin: 10px 0;
      }
    `;

    useEffect(() => {
      insertNester(schema.Nester);
    }, []);
    useEffect(() => {
      if (field.componentProps?.allowSelectExistingRecord) {
        insertSelector(schema.Selector);
      }
    }, [field.componentProps?.allowSelectExistingRecord]);
    return (
      <CollectionProvider_deprecated name={collectionField.target}>
        <ACLCollectionProvider actionPath={`${collectionField.target}:${actionName || 'view'}`}>
          <FormLayout
            layout={layout}
            labelAlign={labelAlign}
            labelWidth={layout === 'horizontal' ? labelWidth : null}
            labelWrap={labelWrap}
          >
            <div
              className={cx(
                InternalNesterCss,
                {
                  [InternalNesterCardCss]: showTitle === false,
                },
                css`
                  .nb-grid-container {
                    height: 100% !important;
                    .ant-formily-item-label {
                      line-height: ${token.controlHeight}px;
                    }
                    .ant-formily-item-label label {
                      white-space: ${labelWrap ? 'break-all' : 'nowrap'};
                    }
                  }
                `,
              )}
            >
              <NocoBaseRecursionField
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
