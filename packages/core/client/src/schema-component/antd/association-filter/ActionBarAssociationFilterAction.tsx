/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Schema, useFieldSchema } from '@formily/react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { createDesignable } from '../..';
import { useAPIClient } from '../../../api-client';
import { useBlockRequestContext } from '../../../block-provider';
import { mergeFilter } from '../../../filter-provider/utils';
import { useRefreshFieldSchema } from '../../../formily/NocoBaseRecursionField';
import { ActionInitializerItem } from '../../../schema-initializer/items/ActionInitializerItem';

/**
 * @deprecated
 * @param props
 * @returns
 */
export const ActionBarAssociationFilterAction = (props) => {
  const refreshFieldSchema = useRefreshFieldSchema();
  const fieldSchema = useFieldSchema();
  const api = useAPIClient();
  const { t } = useTranslation();
  const dn = createDesignable({ t, api, refresh: refreshFieldSchema, current: fieldSchema });
  const { service, props: blockProps } = useBlockRequestContext();

  dn.loadAPIClientEvents();

  const handleInsert = (s: Schema) => {
    dn.insertBeforeBegin(s);
  };

  const handleRemove = (schema, remove) => {
    remove(schema);
    service.run({
      ...service.params?.[0],
      filter: mergeFilter([blockProps?.params?.filter]),
    });
  };

  const schema = {
    type: 'void',
    'x-action': 'associateFilter',
    'x-initializer': 'AssociationFilter.Initializer',
    'x-component': 'AssociationFilter',
    properties: {},
  };

  const newProps = {
    ...props,
    insert: handleInsert,
    remove: handleRemove,
    wrap: (s) => s,
  };

  return <ActionInitializerItem {...newProps} schema={schema} />;
};
