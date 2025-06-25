/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css } from '@emotion/css';
import { useField } from '@formily/react';
import {
  ACLCustomContext,
  Action,
  APIClientProvider,
  AssociationField,
  CollectionManager,
  DataSource,
  DataSourceApplicationProvider,
  DataSourceManager,
  DatePicker,
  GlobalThemeProvider,
  PoweredBy,
  SchemaComponent,
  SchemaComponentContext,
  useApp,
  useCompile,
  useRequest,
  VariablesProvider,
} from '@nocobase/client';
import { Input, Modal, Spin } from 'antd';
import { Button as MobileButton, Dialog as MobileDialog } from 'antd-mobile';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { isDesktop } from 'react-device-detect';
import { useParams } from 'react-router';
import { usePublicSubmitActionProps } from '../hooks';
import { MobileDateTimePicker } from './components/MobileDatePicker';
import { MobilePicker } from './components/MobilePicker';
import { UnEnabledFormPlaceholder, UnFoundFormPlaceholder } from './UnEnabledFormPlaceholder';

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

  useEffect(() => {
    const interceptor = app.apiClient.axios.interceptors.request.use((config) => {
      if (config.headers) {
        config.headers['X-Form-Token'] = localStorage.getItem('NOCOBASE_FORM_TOKEN') || '';
      }
      return config;
    });

    return () => {
      app.apiClient.axios.interceptors.request.eject(interceptor);
    };
  }, [app.apiClient.axios.interceptors.request]);

  return <APIClientProvider apiClient={app.apiClient}>{children}</APIClientProvider>;
}

function useTitle(data) {
  const compile = useCompile();
  useEffect(() => {
    if (!data) return;
    document.title = compile(data?.data?.title);
  }, [data]);
}

export const PublicFormMessageContext = createContext<any>({});
export const PageBackgroundColor = '#f5f5f5';

const PublicFormMessageProvider = ({ children }) => {
  const [showMessage, setShowMessage] = useState(false);
  const field = useField();

  const toggleFieldVisibility = (fieldName, visible) => {
    field.form.query(fieldName).take((f) => {
      if (f) {
        f.visible = visible;
        f.hidden = !visible;
      }
    });
  };

  useEffect(() => {
    toggleFieldVisibility('success', showMessage);
    toggleFieldVisibility('form', !showMessage);
    if (!showMessage) {
      field.form.query('promptMessage').take((f) => {
        if (f) {
          f.visible = false;
          f.hidden = true;
        }
      });
    }
  }, [showMessage]);

  return (
    <PublicFormMessageContext.Provider value={{ showMessage, setShowMessage }}>
      {children}
    </PublicFormMessageContext.Provider>
  );
};
function isMobile() {
  return window.matchMedia('(max-width: 768px)').matches;
}

const AssociationFieldMobile = (props) => {
  return <AssociationField {...props} popupMatchSelectWidth={true} />;
};

AssociationFieldMobile.SubTable = AssociationField.SubTable;
AssociationFieldMobile.Nester = AssociationField.Nester;
AssociationFieldMobile.AddNewer = Action.Container;
AssociationFieldMobile.Selector = Action.Container;
AssociationFieldMobile.Viewer = Action.Container;
AssociationFieldMobile.InternalSelect = AssociationField.InternalSelect;
AssociationFieldMobile.ReadPretty = AssociationField.ReadPretty;
AssociationFieldMobile.FileSelector = AssociationField.FileSelector;

const DatePickerMobile = (props) => {
  return <MobileDateTimePicker {...props} />;
};
DatePickerMobile.FilterWithPicker = DatePicker.FilterWithPicker;
DatePickerMobile.RangePicker = DatePicker.RangePicker;

const mobileComponents = {
  Button: MobileButton,
  Select: (props) => {
    return <MobilePicker {...props} />;
  },
  DatePicker: DatePickerMobile,
  UnixTimestamp: MobileDateTimePicker,
  Modal: MobileDialog,
  AssociationField: AssociationFieldMobile,
};
function InternalPublicForm() {
  const params = useParams();
  const isMobileMedia = isMobile();
  const { error, data, loading, run } = useRequest<any>(
    {
      url: `publicForms:getMeta/${params.name}`,
      skipAuth: true,
    },
    {
      onSuccess(data) {
        localStorage.setItem('NOCOBASE_FORM_TOKEN', data?.data?.token);
      },
    },
  );
  const [pwd, setPwd] = useState('');
  const ctx = useContext(SchemaComponentContext);
  useTitle(data);
  // 设置的移动端 meta
  useEffect(() => {
    if (!isDesktop) {
      let viewportMeta = document.querySelector('meta[name="viewport"]');
      if (!viewportMeta) {
        viewportMeta = document.createElement('meta');
        viewportMeta.setAttribute('name', 'viewport');
        document.head.appendChild(viewportMeta);
      }
      viewportMeta.setAttribute('content', 'width=device-width,minimum-scale=1.0,maximum-scale=1.0,user-scalable=no');

      document.body.style.backgroundColor = PageBackgroundColor;
      document.body.style.overflow = 'hidden';

      // 触发视图重绘
      const fakeBody = document.createElement('div');
      document.body.appendChild(fakeBody);
      document.body.removeChild(fakeBody);
    }
  }, []);

  if (error?.['response']?.status === 401 || data?.data?.passwordRequired) {
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

  if (error?.['response']?.status === 500) {
    return <UnFoundFormPlaceholder />;
  }

  if (loading) {
    return <Spin />;
  }
  if (!data?.data) {
    return <UnEnabledFormPlaceholder />;
  }
  const components = isMobileMedia ? mobileComponents : {};
  return (
    <ACLCustomContext.Provider value={{ allowAll: true }}>
      <PublicAPIClientProvider>
        <div
          style={{
            minHeight: '100vh',
            background: PageBackgroundColor,
            height: '100%',
            overflow: 'auto',
          }}
        >
          <div
            style={{
              maxWidth: 800,
              margin: '0 auto',
              position: 'relative',
              zIndex: 0 /** create a new z-index context */,
            }}
            className={css`
              @media (min-width: 1025px) {
                padding-top: 10vh;
              }
              padding-top: 0px;
            `}
          >
            <PublicPublicFormProvider dataSource={data?.data?.dataSource}>
              <VariablesProvider>
                <SchemaComponentContext.Provider value={{ ...ctx, designable: false }}>
                  <SchemaComponent
                    schema={data?.data?.schema}
                    scope={{
                      useCreateActionProps: usePublicSubmitActionProps,
                    }}
                    components={{ PublicFormMessageProvider: PublicFormMessageProvider, ...components }}
                  />
                </SchemaComponentContext.Provider>
              </VariablesProvider>
            </PublicPublicFormProvider>
            <div style={{ marginBottom: '20px' }}>
              <PoweredBy />
            </div>
          </div>
        </div>
      </PublicAPIClientProvider>
    </ACLCustomContext.Provider>
  );
}

export function PublicFormPage() {
  return (
    <GlobalThemeProvider
      theme={{
        token: {
          marginBlock: 18,
          borderRadiusBlock: 0,
          boxShadowTertiary: 'none',
          fontSize: 14,
        },
      }}
    >
      <InternalPublicForm />
    </GlobalThemeProvider>
  );
}
