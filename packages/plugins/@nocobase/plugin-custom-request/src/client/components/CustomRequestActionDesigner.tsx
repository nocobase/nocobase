import { useFieldSchema } from '@formily/react';
import { ArrayItems } from '@formily/antd-v5';
import { Action, SchemaSettings, useAPIClient, useCollection, useCurrentRoles, useRequest } from '@nocobase/client';
import React from 'react';
import { CustomRequestACLSchema, CustomRequestConfigurationFieldsSchema } from '../schemas';
import { useCustomRequestVariableOptions, useGetCustomRequest } from '../hooks';
import { message } from 'antd';
import { useTranslation } from '../locale';
import { listByCurrentRoleUrl } from '../constants';

const useCustomRequestsResource = () => {
  const apiClient = useAPIClient();
  return apiClient.resource('customRequests');
};

function CustomRequestSettingsItem() {
  const { t } = useTranslation();
  const { name } = useCollection();
  const fieldSchema = useFieldSchema();
  const customRequestsResource = useCustomRequestsResource();
  const [messageInstance, messageDom] = message.useMessage();
  const { data, refresh } = useGetCustomRequest();
  return (
    <>
      {messageDom}
      <SchemaSettings.ActionModalItem
        title={t('Request settings')}
        components={{
          ArrayItems,
        }}
        beforeOpen={() => !data && refresh()}
        scope={{ useCustomRequestVariableOptions }}
        schema={CustomRequestConfigurationFieldsSchema}
        initialValues={{
          title: data?.data?.title,
          ...data?.data?.options,
        }}
        onSubmit={async (config) => {
          const { title, ...requestSettings } = config;
          await customRequestsResource.updateOrCreate({
            values: {
              key: fieldSchema['x-uid'],
              title,
              options: {
                ...requestSettings,
                collectionName: name,
              },
            },
            filterKeys: ['key'],
          });
          refresh();
          return messageInstance.success(t('Saved successfully'));
        }}
      />
    </>
  );
}

function CustomRequestACL() {
  const { t } = useTranslation();
  const fieldSchema = useFieldSchema();
  const customRequestsResource = useCustomRequestsResource();
  const [messageInstance, messageDom] = message.useMessage();
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
      {messageDom}
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
          return messageInstance.success(t('Saved successfully'));
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
