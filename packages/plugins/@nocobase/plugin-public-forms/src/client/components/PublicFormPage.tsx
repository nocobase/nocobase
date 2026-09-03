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
import { useMemoizedFn } from 'ahooks';
import {
  DataSourceManager as FlowDataSourceManager,
  FlowContext,
  FlowModelRenderer,
  FlowViewContextProvider,
  useFlowEngine,
} from '@nocobase/flow-engine';
import type { CollectionOptions, CreateModelOptions, DataSourceOptions, FlowModel } from '@nocobase/flow-engine';
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
import type { ISchema } from '@nocobase/client';
import { Form, Input, Modal, Spin } from 'antd';
import { Button as MobileButton, Dialog as MobileDialog } from 'antd-mobile';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { isDesktop, isMobile } from 'react-device-detect';
import { useParams } from 'react-router';
import {
  isPublicFormFlowModelRepository,
  PublicFormFlowModelRepository,
} from '../../client-v2/publicFormFlowModelRepository';
import { usePublicSubmitActionProps } from '../hooks';
import { usePublicFormTranslation } from '../locale';
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
  }, [compile, data]);
}

export const PublicFormMessageContext = createContext<any>({});
export const PageBackgroundColor = '#f5f5f5';

const getPublicFormContainerHeight = () => {
  if (isDesktop) {
    return '100%';
  }

  if (typeof CSS !== 'undefined' && CSS.supports?.('height', '100dvh')) {
    return '100dvh';
  }

  return '100vh';
};

const PublicFormMessageProvider = ({ children }) => {
  const [showMessage, setShowMessage] = useState(false);
  const field = useField();

  const toggleFieldVisibility = useMemoizedFn((fieldName, visible) => {
    field.form.query(fieldName).take((f) => {
      if (f) {
        f.visible = visible;
        f.hidden = !visible;
      }
    });
  });

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
  }, [field.form, showMessage, toggleFieldVisibility]);

  return (
    <PublicFormMessageContext.Provider value={{ showMessage, setShowMessage }}>
      {children}
    </PublicFormMessageContext.Provider>
  );
};

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

type PublicFormDataSourceOptions = DataSourceOptions & {
  collections?: CollectionOptions[];
};

type PublicFormMeta = {
  dataSource?: PublicFormDataSourceOptions | null;
  flowModel?: CreateModelOptions | null;
  schema?: ISchema | null;
};

type ResponseErrorLike = {
  response?: {
    status?: number;
  };
};

function getResponseStatus(error: unknown) {
  return (error as ResponseErrorLike | null)?.response?.status;
}

type PublicFormRuntimeView = {
  type: 'embed';
  inputArgs: Record<string, unknown>;
  Header: null;
  Footer: null;
  close: () => Promise<void>;
  update: () => void;
};

const PUBLIC_FORM_RUNTIME_CACHE_KEYS = ['dataSourceManager', 'dataSource', 'collection', 'resource', 'association'];

function getPublicFormPageModel(routeModel?: FlowModel | null) {
  const page = routeModel?.subModels?.page;
  return Array.isArray(page) ? page[0] : page;
}

function visitFlowModelTree(model: FlowModel | null | undefined, callback: (model: FlowModel) => void) {
  const visited = new Set<FlowModel>();
  const visit = (current?: FlowModel | FlowModel[] | null) => {
    if (!current) {
      return;
    }

    if (Array.isArray(current)) {
      current.forEach(visit);
      return;
    }

    if (visited.has(current)) {
      return;
    }

    visited.add(current);
    callback(current);
    Object.values(current.subModels || {}).forEach(visit);
  };

  visit(model);
}

function PublicFormFlowRuntime(props: { formKey?: string; meta: PublicFormMeta }) {
  const { formKey, meta } = props;
  const app = useApp();
  const flowEngine = useFlowEngine();
  const [loading, setLoading] = useState(true);
  const [routeModel, setRouteModel] = useState<FlowModel | null>(null);
  const [publicFormSubmitted, setPublicFormSubmitted] = useState(false);
  const publicFormSubmittedRef = useRef(false);
  const runtimeContextRef = useRef<FlowContext>();
  const publicDataSourceManagerRef = useRef<FlowDataSourceManager>();
  const attachedRuntimeModelsRef = useRef<Set<FlowModel>>(new Set());
  const originalModelRepositoryRef = useRef(flowEngine.modelRepository);

  publicFormSubmittedRef.current = publicFormSubmitted;

  const getPublicDataSourceManager = useCallback(() => {
    if (!publicDataSourceManagerRef.current) {
      const manager = new FlowDataSourceManager();
      const rootManager = flowEngine.context.dataSourceManager;

      manager.setFlowEngine(flowEngine);
      manager.setRequester(rootManager?.requester);
      manager.setCollectionFieldInterfaceManager(rootManager?.collectionFieldInterfaceManager);
      publicDataSourceManagerRef.current = manager;
    }

    return publicDataSourceManagerRef.current;
  }, [flowEngine]);

  if (!runtimeContextRef.current) {
    const runtimeContext = new FlowContext();
    const view: PublicFormRuntimeView = {
      type: 'embed',
      inputArgs: {},
      Header: null,
      Footer: null,
      close: async () => undefined,
      update: () => undefined,
    };

    runtimeContext.addDelegate(flowEngine.context);
    runtimeContext.defineProperty('view', {
      value: view,
    });
    runtimeContext.defineProperty('publicFormRuntime', {
      get: () => true,
      cache: false,
    });
    runtimeContext.defineProperty('dataSourceManager', {
      get: () => getPublicDataSourceManager(),
      cache: false,
    });
    runtimeContext.defineProperty('publicFormDataSourceManager', {
      get: () => getPublicDataSourceManager(),
      cache: false,
    });
    runtimeContext.defineProperty('publicFormSubmitted', {
      get: () => publicFormSubmittedRef.current,
      observable: true,
      cache: false,
    });
    runtimeContext.defineProperty('skipAclCheck', {
      get: () => true,
      cache: false,
    });
    runtimeContext.defineProperty('flowSettingsEnabled', {
      get: () => false,
      cache: false,
    });
    runtimeContext.defineMethod('setPublicFormSubmitted', (submitted: boolean) => {
      setPublicFormSubmitted(!!submitted);
    });
    runtimeContextRef.current = runtimeContext;
  }

  useEffect(() => {
    const currentRepository = flowEngine.modelRepository;

    if (isPublicFormFlowModelRepository(currentRepository)) {
      currentRepository.setFormKey(formKey);
      return;
    }

    if (!app?.apiClient || !currentRepository) {
      return;
    }

    const repository = new PublicFormFlowModelRepository({
      app,
      formKey,
      delegate: currentRepository,
    });

    originalModelRepositoryRef.current = currentRepository;
    flowEngine.setModelRepository(repository);

    return () => {
      if (flowEngine.modelRepository === repository && originalModelRepositoryRef.current) {
        flowEngine.setModelRepository(originalModelRepositoryRef.current);
      }
    };
  }, [app, flowEngine, formKey]);

  useEffect(() => {
    const dataSource = meta?.dataSource;
    if (!dataSource?.key) {
      return;
    }

    const { collections = [], ...options } = dataSource;
    const manager = getPublicDataSourceManager();

    manager.upsertDataSource(options);
    manager.getDataSource(dataSource.key)?.setCollections(collections, { clearFields: true });
  }, [getPublicDataSourceManager, meta?.dataSource]);

  useEffect(() => {
    let cancelled = false;

    const detachRuntimeContext = () => {
      const runtimeContext = runtimeContextRef.current;
      if (runtimeContext) {
        attachedRuntimeModelsRef.current.forEach((model) => {
          model.context?.removeDelegate?.(runtimeContext);
        });
      }
      attachedRuntimeModelsRef.current.clear();
    };

    const attachRuntimeContext = (model: FlowModel) => {
      const runtimeContext = runtimeContextRef.current;
      if (!runtimeContext) {
        return;
      }

      visitFlowModelTree(model, (currentModel) => {
        currentModel.context?.addDelegate?.(runtimeContext);
        PUBLIC_FORM_RUNTIME_CACHE_KEYS.forEach((key) => {
          currentModel.context?.removeCache?.(key);
        });
        attachedRuntimeModelsRef.current.add(currentModel);
      });
    };

    const loadFlowModel = async () => {
      const tree = meta?.flowModel;

      if (!tree?.uid) {
        detachRuntimeContext();
        setRouteModel(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        await flowEngine.resolveModelTree(tree);
        if (cancelled) {
          return;
        }
        const nextRouteModel =
          flowEngine.getModel(tree.uid) ||
          (await flowEngine.createModelAsync(tree, {
            delegate: runtimeContextRef.current,
          }));
        if (cancelled) {
          return;
        }
        const pageModel = getPublicFormPageModel(nextRouteModel);

        if (pageModel?.setProps) {
          pageModel.setProps('publicRuntime', true);
        }
        detachRuntimeContext();
        attachRuntimeContext(nextRouteModel);

        setRouteModel(nextRouteModel);
        setLoading(false);
      } catch (_error) {
        if (!cancelled) {
          detachRuntimeContext();
          setRouteModel(null);
          setLoading(false);
        }
      }
    };

    loadFlowModel();

    return () => {
      cancelled = true;
      detachRuntimeContext();
    };
  }, [flowEngine, meta?.flowModel]);

  const pageModel = getPublicFormPageModel(routeModel);

  if (loading) {
    return <Spin />;
  }

  if (!pageModel || !runtimeContextRef.current) {
    return <UnFoundFormPlaceholder />;
  }

  return (
    <FlowViewContextProvider context={runtimeContextRef.current}>
      <FlowModelRenderer model={pageModel} showFlowSettings={false} />
    </FlowViewContextProvider>
  );
}

function InternalPublicForm() {
  const params = useParams();
  const { t } = usePublicFormTranslation();
  const [pwd, setPwd] = useState('');
  const [passwordErrorMessage, setPasswordErrorMessage] = useState('');
  const { error, data, loading, run } = useRequest<any>(
    {
      url: `publicForms:getMeta/${params.name}`,
      skipAuth: true,
      skipNotify: (nextError) => getResponseStatus(nextError) === 401,
    },
    {
      onSuccess(data) {
        setPasswordErrorMessage('');
        localStorage.setItem('NOCOBASE_FORM_TOKEN', data?.data?.token);
      },
      onError(nextError) {
        if (getResponseStatus(nextError) === 401) {
          setPasswordErrorMessage(t('Incorrect password'));
        }
      },
    },
  );
  const ctx = useContext(SchemaComponentContext);

  useTitle(data);
  useEffect(() => {
    if (getResponseStatus(error) === 401) {
      setPasswordErrorMessage(t('Incorrect password'));
    }
  }, [error, t]);
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

  if (getResponseStatus(error) === 401 || data?.data?.passwordRequired) {
    return (
      <div>
        <Modal
          centered
          title={t('Password')}
          open={true}
          cancelButtonProps={{
            hidden: true,
          }}
          confirmLoading={loading}
          onOk={() => {
            setPasswordErrorMessage('');
            run({
              password: pwd,
            });
          }}
        >
          <Form layout="vertical">
            <Form.Item
              validateStatus={passwordErrorMessage ? 'error' : undefined}
              help={passwordErrorMessage || undefined}
              style={{ marginBottom: 0 }}
            >
              <Input.Password
                value={pwd}
                onChange={(e) => {
                  setPwd(e.target.value);
                  if (passwordErrorMessage) {
                    setPasswordErrorMessage('');
                  }
                }}
              />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    );
  }

  if (getResponseStatus(error) === 500) {
    return <UnFoundFormPlaceholder />;
  }

  if (loading) {
    return <Spin />;
  }
  if (!data?.data) {
    return <UnEnabledFormPlaceholder />;
  }
  const meta = data.data as PublicFormMeta;
  const components = isMobile ? mobileComponents : {};
  const containerHeight = getPublicFormContainerHeight();
  return (
    <ACLCustomContext.Provider value={{ allowAll: true }}>
      <PublicAPIClientProvider>
        <div
          style={{
            minHeight: isDesktop ? '100vh' : containerHeight,
            background: PageBackgroundColor,
            height: containerHeight,
            ...(isDesktop
              ? { overflow: 'auto' }
              : {
                  overflowX: 'hidden',
                  overflowY: 'auto',
                  WebkitOverflowScrolling: 'touch',
                }),
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
            {meta.flowModel ? (
              <PublicFormFlowRuntime formKey={params.name} meta={meta} />
            ) : (
              <PublicPublicFormProvider dataSource={meta.dataSource}>
                <SchemaComponentContext.Provider value={{ ...ctx, designable: false }}>
                  <SchemaComponent
                    schema={meta.schema || undefined}
                    scope={{
                      useCreateActionProps: usePublicSubmitActionProps,
                    }}
                    components={{ PublicFormMessageProvider: PublicFormMessageProvider, ...components }}
                  />
                </SchemaComponentContext.Provider>
              </PublicPublicFormProvider>
            )}
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
      <VariablesProvider
        filterVariables={(v) => {
          return !['$user', '$nRole', '$nToken'].includes(v.key);
        }}
      >
        <InternalPublicForm />
      </VariablesProvider>
    </GlobalThemeProvider>
  );
}
