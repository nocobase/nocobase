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
import { RecursionField, observer, useField, useFieldSchema } from '@formily/react';
import React, { useEffect } from 'react';
import { ACLCollectionProvider, useACLActionParamsContext } from '../../../acl';
import { CollectionProvider_deprecated } from '../../../collection-manager';
import { useAssociationFieldContext, useInsertSchema } from './hooks';
import schema from './schema';

const InternalNesterCss = css`
  & .ant-formily-item-layout-vertical {
    margin-bottom: 10px;
  }
  .ant-card-body {
    padding: 15px 20px 5px;
  }
  .ant-divider-horizontal {
    margin: 10px 0;
  }
`;

const InternalNesterCardCss = css`
  .ant-card-bordered {
    border: none;
  }
  .ant-card-body {
    padding: 0px 20px 20px 0px;
  }
`;

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
                InternalNesterCss,
                {
                  [InternalNesterCardCss]: showTitle === false,
                },
                css`
                  .nb-grid-container {
                    height: 100% !important;
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
        </ACLCollectionProvider>
      </CollectionProvider_deprecated>
    );
  },
  { displayName: 'InternalNester' },
);
