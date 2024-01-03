import { useFieldSchema } from '@formily/react';
import { ArrayItems } from '@formily/antd-v5';
import {
  Action,
  SchemaSettings,
  SchemaSettingsActionModalItem,
  actionSettingsItems,
  useCollection,
  useCompile,
  useRequest,
} from '@nocobase/client';
import React, { useMemo } from 'react';
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
      <SchemaSettingsActionModalItem
        title={t('Request settings')}
        components={{
          ArrayItems,
        }}
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
  const compile = useCompile();
  const { refresh: refreshRoleCustomKeys } = useRequest<{ data: string[] }>(
    {
      url: listByCurrentRoleUrl,
    },
    {
      manual: true,
      cacheKey: listByCurrentRoleUrl,
    },
  );

  const { data: allRoles } = useRequest<any>({
    url: '/roles:list',
  });

  const currentRoles = useMemo(() => {
    allRoles?.data?.map(({ name, title }) => ({ name, title: compile(title) }));
  }, [allRoles?.data]);

  return (
    <>
      <SchemaSettingsActionModalItem
        title={t('Access Control')}
        schema={CustomRequestACLSchema}
        scope={{
          currentRoles,
        }}
        initialValues={{
          roles: data?.data?.roles,
        }}
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
