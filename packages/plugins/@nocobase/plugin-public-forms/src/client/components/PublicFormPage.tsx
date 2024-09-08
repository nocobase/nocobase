/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  APIClient,
  APIClientProvider,
  CollectionManager,
  DataSource,
  DataSourceApplicationProvider,
  DataSourceManager,
  PoweredBy,
  SchemaComponent,
  SchemaComponentContext,
  useAPIClient,
  useApp,
  useRequest,
} from '@nocobase/client';
import { Input, Modal, Spin } from 'antd';
import React, { useContext, useMemo, useState } from 'react';
import { useParams } from 'react-router';
import { usePublicSubmitActionProps } from '../hooks';

class PublicDataSource extends DataSource {
  async getDataSource() {
    return {};
  }
}

function PublicPublicFormProvider(props) {
  const { dataSource } = props;
  const app = useApp();
  const [dataSourceManager, collectionManager] = useMemo(() => {
    const dataSourceManager = new DataSourceManager({}, app);
    const dataSourceInstance = dataSourceManager.addDataSource(PublicDataSource, dataSource);
    const collectionManager = new CollectionManager([], dataSourceInstance);
    return [dataSourceManager, collectionManager];
  }, [app, dataSource]);
  return (
    <div>
      <DataSourceApplicationProvider
        dataSource={dataSource.key}
        dataSourceManager={dataSourceManager}
        instance={collectionManager}
      >
        {props.children}
      </DataSourceApplicationProvider>
    </div>
  );
}

function PublicAPIClientProvider({ children }) {
  const app = useApp();
  const apiClient = useMemo(() => {
    const apiClient = new APIClient(app.getOptions().apiClient as any);
    apiClient.app = app;
    apiClient.axios.interceptors.request.use((config) => {
      if (config.headers) {
        config.headers['X-Form-Token'] = apiClient.storage.getItem('NOCOBASE_FORM_TOKEN') || '';
      }
      return config;
    });
    return apiClient;
  }, [app]);
  return <APIClientProvider apiClient={apiClient}>{children}</APIClientProvider>;
}

function InternalPublicForm() {
  const params = useParams();
  const apiClient = useAPIClient();
  const { error, data, loading, run } = useRequest<any>(
    {
      url: `publicForms:getMeta/${params.name}`,
    },
    {
      onSuccess(data) {
        apiClient.axios.interceptors.request.use((config) => {
          if (config.headers) {
            config.headers['X-Form-Token'] = data?.data?.token || '';
          }
          apiClient.storage.setItem('NOCOBASE_FORM_TOKEN', data?.data?.token);
          return config;
        });
      },
    },
  );
  const [pwd, setPwd] = useState('');
  const ctx = useContext(SchemaComponentContext);
  if (error) {
    if (error?.['response']?.status === 401) {
      return (
        <div>
          <Modal
            centered
            title="Password"
            open={true}
            cancelButtonProps={{
              hidden: true,
            }}
            onOk={() => {
              run({
                password: pwd,
              });
            }}
          >
            <Input.Password
              onChange={(e) => {
                setPwd(e.target.value);
              }}
            />
          </Modal>
        </div>
      );
    }
    return <div>Error</div>;
  }
  if (loading) {
    return <Spin />;
  }
  console.log(data?.data?.dataSource);
  return (
    <div
      style={{
        height: '100vh',
        background: '#f5f5f5',
      }}
    >
      <div style={{ maxWidth: 800, margin: '0 auto', paddingTop: '10vh' }}>
        <PublicPublicFormProvider dataSource={data?.data?.dataSource}>
          <SchemaComponentContext.Provider value={{ ...ctx, designable: false }}>
            <SchemaComponent schema={data?.data?.schema} scope={{ useCreateActionProps: usePublicSubmitActionProps }} />
          </SchemaComponentContext.Provider>
        </PublicPublicFormProvider>
        <PoweredBy />
      </div>
    </div>
  );
}

export function PublicFormPage() {
  return (
    <PublicAPIClientProvider>
      <InternalPublicForm />
    </PublicAPIClientProvider>
  );
}
