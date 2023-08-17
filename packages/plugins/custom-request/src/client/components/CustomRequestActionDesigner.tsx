import { useFieldSchema } from '@formily/react';
import { ArrayItems } from '@formily/antd-v5';
import {
  Action,
  SchemaComponent,
  SchemaComponentOptions,
  SchemaSettings,
  useAPIClient,
  useDesignable,
  useRequest,
} from '@nocobase/client';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { CustomRequestConfigurationFieldsSchema } from '../schemas';
import { useCustomRequestVariableOptions } from '../hooks';

function CustomRequestSettingsItem() {
  const { t } = useTranslation();
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

  return (
    <SchemaComponentOptions
      components={{
        ArrayItems,
      }}
      scope={{
        useCustomRequestVariableOptions,
      }}
    >
      {data ? (
        <SchemaSettings.ActionModalItem
          title={t('Request settings')}
          schema={CustomRequestConfigurationFieldsSchema}
          initialValues={data?.data?.options}
          onSubmit={(requestSettings) => {
            customRequests.create({
              values: {
                key: fieldSchema['x-uid'],
                options: requestSettings,
              },
            });
          }}
        />
      ) : null}
    </SchemaComponentOptions>
  );
}

export const CustomRequestActionDesigner: React.FC = () => {
  return (
    <Action.Designer>
      <CustomRequestSettingsItem />
    </Action.Designer>
  );
};
