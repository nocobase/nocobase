import { useFieldSchema } from '@formily/react';
import { ArrayItems } from '@formily/antd-v5';
import { Action, SchemaSettings, useAPIClient, useCollection, useRequest } from '@nocobase/client';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { CustomRequestConfigurationFieldsSchema } from '../schemas';
import { useCustomRequestVariableOptions } from '../hooks';

const useCustomRequestsResource = () => {
  const apiClient = useAPIClient();
  return apiClient.resource('customRequests');
};

function CustomRequestSettingsItem() {
  const { t } = useTranslation();
  const { name } = useCollection();
  const fieldSchema = useFieldSchema();
  const customRequestsResource = useCustomRequestsResource();
  const url = `customRequests:get/${fieldSchema['x-uid']}`;
  const { data } = useRequest<{ data: { options: any } }>(
    {
      url,
    },
    {
      cacheKey: url,
    },
  );

  return data ? (
    <SchemaSettings.ActionModalItem
      title={t('Request settings')}
      components={{
        ArrayItems,
      }}
      scope={{ useCustomRequestVariableOptions }}
      schema={CustomRequestConfigurationFieldsSchema}
      initialValues={data?.data?.options}
      onSubmit={(requestSettings) => {
        customRequestsResource.updateOrCreate({
          values: {
            key: fieldSchema['x-uid'],
            options: {
              ...requestSettings,
              collectionName: name,
            },
          },
          filterKeys: ['key'],
        });
      }}
    />
  ) : null;
}

export const CustomRequestActionDesigner: React.FC = () => {
  const customRequestsResource = useCustomRequestsResource();
  const fieldSchema = useFieldSchema();
  return (
    <Action.Designer
      removeButtonProps={{
        onConfirmOk() {
          customRequestsResource.destroy({
            filterByTk: fieldSchema['x-uid'],
          });
        },
      }}
    >
      <CustomRequestSettingsItem />
    </Action.Designer>
  );
};
