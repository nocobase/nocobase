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
  ACLCustomContext,
} from '@nocobase/client';
import { useField } from '@formily/react';
import { Input, Modal, Spin } from 'antd';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router';
import { usePublicSubmitActionProps } from '../hooks';
import { UnEnabledFormPlaceholder } from './UnEnabledFormPlaceholder';
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
        config.headers['X-Form-Token'] = localStorage.getItem('NOCOBASE_FORM_TOKEN') || '';
      }
      return config;
    });
    return apiClient;
  }, [app]);
  return <APIClientProvider apiClient={apiClient}>{children}</APIClientProvider>;
}

export const PublicFormMessageContext = createContext<any>({});

const PublicFormMessageProvider = (props) => {
  const [showMessage, setShowMessage] = useState(false);
  const field = useField();
  useEffect(() => {
    if (showMessage) {
      field.form.query('success').take((f) => {
        f.visible = true;
        f.hidden = false;
      });
      field.form.query('form').take((f) => {
        f.visible = false;
        f.hidden = true;
      });
    } else {
      field.form.query('success').take((f) => {
        f.visible = false;
        f.hidden = true;
      });
      field.form.query('form').take((f) => {
        f.visible = true;
        f.hidden = false;
      });
    }
  }, [showMessage]);
  return (
    <PublicFormMessageContext.Provider value={{ showMessage, setShowMessage }}>
      {props.children}
    </PublicFormMessageContext.Provider>
  );
};
function InternalPublicForm() {
  const params = useParams();
  const apiClient = useAPIClient();
  const { error, data, loading, run } = useRequest<any>(
    {
      url: `publicForms:getMeta/${params.name}`,
    },
    {
      onSuccess(data) {
        localStorage.setItem('NOCOBASE_FORM_TOKEN', data?.data?.token);
        apiClient.axios.interceptors.request.use((config) => {
          if (config.headers) {
            config.headers['X-Form-Token'] = data?.data?.token || '';
          }
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
  if (!data?.data) {
    return <UnEnabledFormPlaceholder />;
  }
  return (
    <ACLCustomContext.Provider value={{ allowAll: true }}>
      <PublicAPIClientProvider>
        <div
          style={{
            height: '100vh',
            background: '#f5f5f5',
          }}
        >
          <div style={{ maxWidth: 800, margin: '0 auto', paddingTop: '10vh' }}>
            <PublicPublicFormProvider dataSource={data?.data?.dataSource}>
              <SchemaComponentContext.Provider value={{ ...ctx, designable: false }}>
                <SchemaComponent
                  schema={data?.data?.schema}
                  scope={{
                    useCreateActionProps: usePublicSubmitActionProps,
                  }}
                  components={{ PublicFormMessageProvider: PublicFormMessageProvider }}
                />
              </SchemaComponentContext.Provider>
            </PublicPublicFormProvider>
            <PoweredBy />
          </div>
        </div>
      </PublicAPIClientProvider>
    </ACLCustomContext.Provider>
  );
}

export function PublicFormPage() {
  return <InternalPublicForm />;
}
