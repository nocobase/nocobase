import {
  AntdSchemaComponentProvider,
  APIClient,
  APIClientProvider,
  PluginManager,
  PluginManagerProvider,
  SchemaComponentProvider,
  SystemSettingsProvider,
  SystemSettingsShortcut,
  useSystemSettings,
} from '@nocobase/client';
import MockAdapter from 'axios-mock-adapter';
import React from 'react';

const apiClient = new APIClient();

const mock = new MockAdapter(apiClient.axios);

mock.onGet('/systemSettings:get/1').reply(200, {
  data: {
    title: 'NocoBase',
  },
});

const Demo = () => {
  const { data } = useSystemSettings();
  return (
    <div>
      <h3>以下为测试内容</h3>
      System title: {data?.data?.title}
    </div>
  );
};

export default () => {
  return (
    <APIClientProvider apiClient={apiClient}>
      <SystemSettingsProvider>
        <SchemaComponentProvider>
          <AntdSchemaComponentProvider>
            <PluginManagerProvider components={{ SystemSettingsShortcut }}>
              <PluginManager.Toolbar
                items={[
                  {
                    component: 'SystemSettingsShortcut',
                    pin: true,
                  },
                ]}
              />
              <Demo />
            </PluginManagerProvider>
          </AntdSchemaComponentProvider>
        </SchemaComponentProvider>
      </SystemSettingsProvider>
    </APIClientProvider>
  );
};
