import { useFieldSchema } from '@formily/react';
import { ArrayItems } from '@formily/antd-v5';
import { Action, SchemaSettings, useCollection, useCurrentRoles, useRequest } from '@nocobase/client';
import React, { useEffect } from 'react';
import { CustomRequestACLSchema, CustomRequestConfigurationFieldsSchema } from '../schemas';
import { useCustomRequestVariableOptions, useGetCustomRequest } from '../hooks';
import { App } from 'antd';
import { useTranslation } from '../locale';
import { listByCurrentRoleUrl } from '../constants';
import { useCustomRequestsResource } from '../hooks/useCustomRequestsResource';

function CustomRequestSettingsItem() {
  const { t } = useTranslation();
  const { name } = useCollection();
  const fieldSchema = useFieldSchema();
  const customRequestsResource = useCustomRequestsResource();
  const { message } = App.useApp();
  const { data, refresh } = useGetCustomRequest();

  return (
    <>
      <SchemaSettings.ActionModalItem
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
          await customRequestsResource.updateOrCreate({
            values: {
              key: fieldSchema['x-uid'],
              options: {
                ...requestSettings,
                collectionName: name,
              },
            },
            filterKeys: ['key'],
          });
          refresh();
          return message.success(t('Saved successfully'));
        }}
      />
    </>
  );
}

function CustomRequestACL() {
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

  const currentRoles = useCurrentRoles();

  return (
    <>
      <SchemaSettings.ActionModalItem
        title={t('Access Control')}
        schema={CustomRequestACLSchema}
        scope={{ currentRoles }}
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

export const CustomRequestActionDesigner: React.FC = () => {
  const customRequestsResource = useCustomRequestsResource();
  const fieldSchema = useFieldSchema();
  return (
    <Action.Designer
      linkageAction
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
    >
      <CustomRequestSettingsItem />
      <CustomRequestACL />
    </Action.Designer>
  );
};
