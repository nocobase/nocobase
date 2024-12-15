/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ArrayItems } from '@formily/antd-v5';
import { useFieldSchema } from '@formily/react';
import {
  Action,
  SchemaSettings,
  SchemaSettingsActionModalItem,
  actionSettingsItems,
  useCollection_deprecated,
  useDataSourceKey,
  useDesignable,
  useRequest,
} from '@nocobase/client';
import { App } from 'antd';
import React from 'react';
import { listByCurrentRoleUrl } from '../constants';
import { useCustomRequestVariableOptions, useGetCustomRequest } from '../hooks';
import { useCustomRequestsResource } from '../hooks/useCustomRequestsResource';
import { useTranslation } from '../locale';
import { CustomRequestACLSchema, CustomRequestConfigurationFieldsSchema } from '../schemas';

export function CustomRequestSettingsItem() {
  const { t } = useTranslation();
  const { name } = useCollection_deprecated();
  const dataSourceKey = useDataSourceKey();
  const fieldSchema = useFieldSchema();
  const customRequestsResource = useCustomRequestsResource();
  const { message } = App.useApp();
  const { data, refresh } = useGetCustomRequest();
  const { dn } = useDesignable();
  return (
    <>
      <SchemaSettingsActionModalItem
        title={t('Request settings')}
        components={{
          ArrayItems,
        }}
        beforeOpen={() => !data && refresh()}
        scope={{ useCustomRequestVariableOptions }}
        schema={CustomRequestConfigurationFieldsSchema}
        initialValues={{
          ...data?.data?.options,
        }}
        onSubmit={async (config) => {
          const { ...requestSettings } = config;
          fieldSchema['x-response-type'] = requestSettings.responseType;
          await customRequestsResource.updateOrCreate({
            values: {
              key: fieldSchema['x-uid'],
              options: {
                ...requestSettings,
                collectionName: name,
                dataSourceKey,
              },
            },
            filterKeys: ['key'],
          });
          dn.emit('patch', {
            schema: {
              'x-response-type': requestSettings.responseType,
              'x-uid': fieldSchema['x-uid'],
            },
          });
          message.success(t('Saved successfully'));
        }}
      />
    </>
  );
}

export function CustomRequestACL() {
  const { t } = useTranslation();
  const fieldSchema = useFieldSchema();
  const customRequestsResource = useCustomRequestsResource();
  const { message } = App.useApp();
  const { data, refresh } = useGetCustomRequest();
  const { refresh: refreshRoleCustomKeys } = useRequest<{ data: string[] }>(
    {
      url: listByCurrentRoleUrl,
    },
    {
      manual: true,
      cacheKey: listByCurrentRoleUrl,
    },
  );

  return (
    <>
      <SchemaSettingsActionModalItem
        title={t('Access control')}
        schema={CustomRequestACLSchema}
        initialValues={{
          roles: data?.data?.roles,
        }}
        beforeOpen={() => !data && refresh()}
        onSubmit={async ({ roles }) => {
          await customRequestsResource.updateOrCreate({
            values: {
              key: fieldSchema['x-uid'],
              roles,
            },
            filterKeys: ['key'],
          });
          refresh();
          refreshRoleCustomKeys();
          return message.success(t('Saved successfully'));
        }}
      />
    </>
  );
}

/**
 * @deprecated
 */
export const customRequestActionSettings = new SchemaSettings({
  name: 'CustomRequestActionSettings',
  items: [
    {
      ...actionSettingsItems[0],
      children: [
        ...actionSettingsItems[0].children,
        {
          name: 'request settings',
          Component: CustomRequestSettingsItem,
        },
        {
          name: 'accessControl',
          Component: CustomRequestACL,
        },
      ],
    },
  ],
});

/**
 * @deprecated
 */
export const CustomRequestActionDesigner: React.FC = () => {
  const customRequestsResource = useCustomRequestsResource();
  const fieldSchema = useFieldSchema();
  return (
    <Action.Designer
      linkageAction
      schemaSettings="CustomRequestActionSettings"
      buttonEditorProps={{
        isLink: fieldSchema['x-action'] === 'customize:table:request',
      }}
      linkageRulesProps={{
        type: 'button',
      }}
      removeButtonProps={{
        onConfirmOk() {
          return customRequestsResource.destroy({
            filterByTk: fieldSchema['x-uid'],
          });
        },
      }}
    ></Action.Designer>
  );
};
