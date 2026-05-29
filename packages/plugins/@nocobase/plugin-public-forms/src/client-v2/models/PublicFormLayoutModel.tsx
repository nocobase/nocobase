/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css } from '@emotion/css';
import { define, observable } from '@formily/reactive';
import { BaseLayoutModel, PoweredBy, useApp } from '@nocobase/client-v2';
import { DataSourceManager, observer, useFlowEngine } from '@nocobase/flow-engine';
import type { CollectionOptions, DataSourceOptions, FlowModel, IFlowModelRepository } from '@nocobase/flow-engine';
import { useRequest } from 'ahooks';
import { Form, Input, Modal, Result, Spin, theme } from 'antd';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useOutlet } from 'react-router-dom';
import { PUBLIC_FORM_TOKEN_KEY } from '../constants';
import { useT } from '../locale';
import { isPublicFormFlowModelRepository, PublicFormFlowModelRepository } from '../publicFormFlowModelRepository';

function getResponseData(response: any) {
  return response?.data?.data;
}

type PublicFormDataSourceOptions = DataSourceOptions & {
  collections?: CollectionOptions[];
};

function usePublicFormTokenHeader() {
  const app = useApp();

  useEffect(() => {
    const interceptor = app.apiClient.axios.interceptors.request.use((config) => {
      config.headers = config.headers || ({} as typeof config.headers);
      config.headers['X-Form-Token'] = localStorage.getItem(PUBLIC_FORM_TOKEN_KEY) || '';
      return config;
    });

    return () => {
      app.apiClient.axios.interceptors.request.eject(interceptor);
    };
  }, [app.apiClient.axios.interceptors.request]);
}

function usePublicFormFlowModel(meta: any) {
  const flowEngine = useFlowEngine();

  return useRequest(
    async () => {
      const tree = meta?.flowModel;
      if (!tree?.uid) {
        return null;
      }

      await flowEngine.resolveModelTree(tree);
      return flowEngine.getModel(tree.uid) || (await flowEngine.createModelAsync(tree));
    },
    {
      refreshDeps: [meta?.flowModel?.uid],
    },
  );
}

const PublicFormLayoutComponent = observer((props: { model: PublicFormLayoutModel }) => {
  const { model } = props;
  const outlet = useOutlet();
  const app = useApp();
  const t = useT();
  const { token } = theme.useToken();
  const [password, setPassword] = useState('');
  const [passwordErrorMessage, setPasswordErrorMessage] = useState('');
  const [routeContentHeight, setRouteContentHeight] = useState(1);
  const [routeContentElement, setRouteContentElement] = useState<HTMLDivElement | null>(null);
  const routeContentRef = useRef<HTMLDivElement | null>(null);
  const pageUid = model.getPageUidFromLayoutRoute(model.currentLayoutRoute);

  const { data, error, loading, run } = useRequest(
    async (nextPassword?: string) => {
      if (!pageUid) {
        return null;
      }

      const response = await app.apiClient.request({
        url: `publicForms:getMeta/${pageUid}`,
        skipAuth: true,
        params:
          typeof nextPassword === 'string'
            ? {
                password: nextPassword,
              }
            : undefined,
      } as any);
      const nextData = getResponseData(response);
      model.applyPublicDataSource(nextData?.dataSource);
      return nextData;
    },
    {
      onSuccess(nextData: any) {
        setPasswordErrorMessage('');
        if (nextData?.token) {
          localStorage.setItem(PUBLIC_FORM_TOKEN_KEY, nextData.token);
        }
      },
      onError(nextError: any) {
        if (nextError?.response?.status === 401) {
          setPasswordErrorMessage(t('Incorrect password'));
        }
      },
      refreshDeps: [pageUid],
    },
  );
  const { loading: modelLoading, data: routeModel } = usePublicFormFlowModel(data);
  const passwordRequired = (error as any)?.response?.status === 401 || data?.passwordRequired;
  const bindLayoutContentElement = useCallback(
    (element: HTMLDivElement | null) => {
      routeContentRef.current = element;
      setRouteContentElement(element);
      model.setLayoutContentElement(element);
    },
    [model],
  );
  const measureRouteContentHeight = useCallback(() => {
    const host = routeContentElement;
    if (!host) {
      return;
    }

    const contentElement =
      (host.querySelector('.nb-block-grid') as HTMLElement | null) ||
      (host.querySelector('.ant-card') as HTMLElement | null) ||
      (host.children[1]?.firstElementChild?.firstElementChild as HTMLElement | undefined);
    const height = Math.ceil(contentElement?.getBoundingClientRect().height || contentElement?.scrollHeight || 0);

    if (height > 0) {
      setRouteContentHeight((previous) => (previous === height ? previous : height));
    }
  }, [routeContentElement]);
  const contentStyle = useMemo<React.CSSProperties>(
    () => ({
      maxWidth: token.screenMD,
      marginInline: 'auto',
    }),
    [token.screenMD],
  );
  const routeContentStyle = useMemo<React.CSSProperties>(
    () => ({
      position: 'relative',
      minHeight: routeContentHeight,
    }),
    [routeContentHeight],
  );
  const routeContentClassName = useMemo(
    () => css`
      @media (max-width: ${token.screenSM}px) {
        .nb-block-grid {
          overflow-x: hidden;
          padding: 0 !important;
        }

        .nb-block-grid > .ant-space > .ant-space-item > div > .ant-row {
          margin-inline: 0 !important;
        }

        .nb-block-grid > .ant-space > .ant-space-item > div > .ant-row > .ant-col {
          padding-inline: 0 !important;
        }
      }
    `,
    [token.screenSM],
  );
  const layoutClassName = useMemo(
    () => css`
      min-height: 100vh;
      background: ${token.colorBgLayout};
      padding: 10vh ${token.padding}px ${token.paddingXL}px;

      @media (max-width: ${token.screenSM}px) {
        padding: 0;
      }
    `,
    [token.colorBgLayout, token.padding, token.paddingXL, token.screenSM],
  );

  usePublicFormTokenHeader();

  useEffect(() => {
    const host = routeContentRef.current;
    if (!host) {
      return;
    }

    let frame = 0;
    const scheduleMeasure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measureRouteContentHeight);
    };
    const resizeObserver = new ResizeObserver(scheduleMeasure);
    const mutationObserver = new MutationObserver(scheduleMeasure);

    resizeObserver.observe(host);
    mutationObserver.observe(host, {
      childList: true,
      subtree: true,
    });
    scheduleMeasure();

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [measureRouteContentHeight, outlet, routeContentElement]);

  useEffect(() => {
    model.setPublicFormSubmitted(false);
  }, [model, pageUid]);

  useEffect(() => {
    model.setPublicFormKey(pageUid);
  }, [model, pageUid]);

  useEffect(() => {
    if (data?.title) {
      document.title = data.title;
    }
  }, [data?.title]);

  if (passwordRequired) {
    return (
      <Modal
        centered
        title={t('Password')}
        open
        cancelButtonProps={{ hidden: true }}
        confirmLoading={loading}
        onOk={() => {
          setPasswordErrorMessage('');
          run(password);
        }}
      >
        <Form layout="vertical">
          <Form.Item
            validateStatus={passwordErrorMessage ? 'error' : undefined}
            help={passwordErrorMessage || undefined}
            style={{ marginBottom: 0 }}
          >
            <Input.Password
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                if (passwordErrorMessage) {
                  setPasswordErrorMessage('');
                }
              }}
            />
          </Form.Item>
        </Form>
      </Modal>
    );
  }

  if ((error as any)?.response?.status >= 500) {
    return <Result status="warning" title={t('The form is not found')} />;
  }

  if (!model.currentLayoutRoute) {
    return <Spin />;
  }

  if (!pageUid) {
    return <Result status="warning" title={t('The form is not found')} />;
  }

  if (loading || modelLoading) {
    return <Spin />;
  }

  if (!data) {
    return <Result status="info" title={t('The form is not enabled and cannot be accessed')} />;
  }

  if (!routeModel) {
    return <Result status="warning" title={t('The form is not found')} />;
  }

  return (
    <div className={layoutClassName}>
      <div style={contentStyle}>
        <div ref={bindLayoutContentElement} className={routeContentClassName} style={routeContentStyle}>
          {outlet}
        </div>
        <div>
          <PoweredBy />
        </div>
      </div>
    </div>
  );
});

export class PublicFormLayoutModel extends BaseLayoutModel {
  publicFormSubmitted = false;
  private publicFormKey = '';
  private originalModelRepository?: IFlowModelRepository<FlowModel> | null;
  private publicFormModelRepository?: PublicFormFlowModelRepository;
  private publicDataSourceManager?: DataSourceManager;

  constructor(options: any) {
    super(options);
    define(this, {
      publicFormSubmitted: observable.ref,
    });
  }

  setPublicFormSubmitted(submitted: boolean) {
    this.publicFormSubmitted = !!submitted;
  }

  setPublicFormKey(formKey?: string) {
    this.publicFormKey = formKey || '';
    this.publicFormModelRepository?.setFormKey(this.publicFormKey);
  }

  private getPublicDataSourceManager() {
    if (!this.publicDataSourceManager) {
      const manager = new DataSourceManager();
      const rootManager = this.flowEngine.context.dataSourceManager;

      manager.setFlowEngine(this.flowEngine);
      manager.setRequester(rootManager?.requester);
      manager.setCollectionFieldInterfaceManager(rootManager?.collectionFieldInterfaceManager);
      this.publicDataSourceManager = manager;
    }

    return this.publicDataSourceManager;
  }

  applyPublicDataSource(dataSource?: PublicFormDataSourceOptions | null) {
    if (!dataSource?.key) {
      return;
    }

    const { collections = [], ...options } = dataSource;
    const manager = this.getPublicDataSourceManager();

    manager.upsertDataSource(options);
    manager.getDataSource(dataSource.key)?.setCollections(collections, { clearFields: true });
  }

  private setupPublicFormModelRepository() {
    const currentRepository = this.flowEngine.modelRepository;

    if (isPublicFormFlowModelRepository(currentRepository)) {
      this.publicFormModelRepository = currentRepository;
      this.publicFormModelRepository.setFormKey(this.publicFormKey);
      return;
    }

    const app = this.flowEngine.context.app;
    if (!app?.apiClient || !currentRepository) {
      return;
    }

    const repository = new PublicFormFlowModelRepository({
      app,
      formKey: this.publicFormKey,
      delegate: currentRepository,
    });
    this.originalModelRepository = currentRepository;
    this.publicFormModelRepository = repository;
    this.flowEngine.setModelRepository(repository);
  }

  private restoreModelRepository() {
    if (this.publicFormModelRepository && this.flowEngine.modelRepository === this.publicFormModelRepository) {
      const repository = this.originalModelRepository;
      if (repository) {
        this.flowEngine.setModelRepository(repository);
      }
    }

    this.publicFormModelRepository = undefined;
    this.originalModelRepository = undefined;
  }

  protected onMount(): void {
    super.onMount();
    this.setupPublicFormModelRepository();
    this.context.defineProperty('publicFormRuntime', {
      get: () => true,
      cache: false,
    });
    this.context.defineProperty('dataSourceManager', {
      get: () => this.getPublicDataSourceManager(),
      cache: false,
    });
    this.context.defineProperty('publicFormSubmitted', {
      get: () => this.publicFormSubmitted,
      observable: true,
      cache: false,
    });
    this.context.defineProperty('skipAclCheck', {
      get: () => true,
      cache: false,
    });
    this.context.defineProperty('flowSettingsEnabled', {
      get: () => false,
      cache: false,
    });
    this.context.defineMethod('setPublicFormSubmitted', (submitted: boolean) => {
      this.setPublicFormSubmitted(submitted);
    });
  }

  protected onUnmount(): void {
    this.restoreModelRepository();
    super.onUnmount();
  }

  render() {
    return <PublicFormLayoutComponent model={this} />;
  }
}

export default PublicFormLayoutModel;
