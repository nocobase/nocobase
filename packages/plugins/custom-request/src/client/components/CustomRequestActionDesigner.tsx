import { useFieldSchema } from '@formily/react';
import { ArrayItems } from '@formily/antd-v5';
import {
  Action,
  SchemaComponentOptions,
  SchemaSettings,
  useAPIClient,
  useCollection,
  useRequest,
} from '@nocobase/client';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { CustomRequestConfigurationFieldsSchema } from '../schemas';
import { useCustomRequestVariableOptions } from '../hooks';

function CustomRequestSettingsItem() {
  const { t } = useTranslation();
  const { name } = useCollection();
  const apiClient = useAPIClient();
  const fieldSchema = useFieldSchema();
  const url = `customRequests:get/${fieldSchema['x-uid']}`;
  const { data } = useRequest<{ data: { options: any } }>(
    {
      url,
    },
    {
      cacheKey: url,
    },
  );
  const customRequests = apiClient.resource('customRequests');

  return data ? (
    <SchemaSettings.ActionModalItem
      title={t('Request settings')}
      components={{
        ArrayItems,
      }}
      schema={CustomRequestConfigurationFieldsSchema}
      initialValues={data?.data?.options}
      onSubmit={(requestSettings) => {
        customRequests.updateOrCreate({
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
  return (
    <Action.Designer>
      <CustomRequestSettingsItem />
    </Action.Designer>
  );
};
