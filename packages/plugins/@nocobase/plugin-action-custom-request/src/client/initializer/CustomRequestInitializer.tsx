/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { merge, uid } from '@formily/shared';
import { SchemaInitializerItem, useDesignable, useSchemaInitializer, useSchemaInitializerItem } from '@nocobase/client';
import React from 'react';
import { useCustomRequestsResource } from '../hooks/useCustomRequestsResource';

export const getNewSchema = () => {
  return {
    title: '{{ t("Custom request") }}',
    'x-component': 'CustomRequestAction',
    'x-action': 'customize:form:request',
    'x-toolbar': 'ActionSchemaToolbar',
    'x-settings': 'actionSettings:customRequest',
    'x-decorator': 'CustomRequestAction.Decorator',
    'x-uid': uid(),
    'x-action-settings': {
      onSuccess: {
        manualClose: false,
        redirecting: false,
        successMessage: '{{t("Request success")}}',
      },
    },
  };
};

export const CustomRequestInitializer: React.FC<any> = (props) => {
  const customRequestsResource = useCustomRequestsResource();
  const itemConfig = useSchemaInitializerItem();
  const { insert } = useSchemaInitializer();
  const schema = getNewSchema();

  return (
    <SchemaInitializerItem
      {...itemConfig}
      onClick={async () => {
        const s = merge(schema || {}, itemConfig.schema || {});
        itemConfig?.schemaInitialize?.(s);

        // create a custom request
        await customRequestsResource.create({
          values: {
            key: s['x-uid'],
          },
        });

        insert(s);
      }}
    />
  );
};
