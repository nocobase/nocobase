/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowModel, FlowModelRenderer, useFlowEngine } from '@nocobase/flow-engine';
import { useRequest } from 'ahooks';
import { Input, Modal, Result, Spin, theme } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { PoweredBy, useApp } from '@nocobase/client-v2';
import { PUBLIC_FORM_TOKEN_KEY } from '../constants';
import { useT } from '../locale';

function getResponseData(response: any) {
  return response?.data?.data;
}

function usePublicFormTokenHeader() {
  const app = useApp();

  useEffect(() => {
    const interceptor = app.apiClient.axios.interceptors.request.use((config) => {
      config.headers = config.headers || {};
      config.headers['X-Form-Token'] = localStorage.getItem(PUBLIC_FORM_TOKEN_KEY) || '';
      return config;
    });

    return () => {
      app.apiClient.axios.interceptors.request.eject(interceptor);
    };
  }, [app.apiClient.axios.interceptors.request]);
}

function useApplyPublicDataSource(meta: any) {
  const app = useApp();

  useEffect(() => {
    const dataSource = meta?.dataSource;
    if (!dataSource?.key) {
      return;
    }

    const { collections = [], ...options } = dataSource;
    app.dataSourceManager.upsertDataSource(options);
    app.dataSourceManager.getDataSource(dataSource.key)?.setCollections(collections, { clearFields: true });
  }, [app.dataSourceManager, meta]);
}

function PublicFormRuntimeRenderer(props: { pageModel: FlowModel }) {
  const { pageModel } = props;
  const [submitted, setSubmitted] = useState(false);
  const forkRef = useRef<FlowModel | null>(null);

  if (!forkRef.current) {
    forkRef.current = pageModel.createFork(
      {
        publicRuntime: true,
        publicFormSubmitted: submitted,
      },
      `public-form-${pageModel.uid}`,
    ) as FlowModel;
  }

  useEffect(() => {
    const fork = forkRef.current;
    fork?.setProps({
      publicRuntime: true,
      publicFormSubmitted: submitted,
    });
    fork?.context.defineProperty('publicFormRuntime', {
      value: true,
    });
    fork?.context.defineMethod('setPublicFormSubmitted', setSubmitted);
  }, [submitted]);

  useEffect(() => {
    return () => {
      forkRef.current?.dispose?.();
      forkRef.current = null;
    };
  }, []);

  return <FlowModelRenderer model={forkRef.current} />;
}

function PublicFormBody(props: { meta: any }) {
  const { meta } = props;
  const flowEngine = useFlowEngine();
  const { token } = theme.useToken();
  const { data: pageModel, loading } = useRequest(
    async () => {
      const tree = meta?.flowModel;
      const page = tree?.subModels?.page;

      if (!page) {
        return null;
      }

      await flowEngine.resolveModelTree(tree);
      const existing = flowEngine.getModel(tree.uid);
      const rootModel = existing || (await flowEngine.createModelAsync(tree));
      return rootModel.subModels?.page || null;
    },
    {
      refreshDeps: [meta?.flowModel?.uid],
    },
  );

  if (loading) {
    return <Spin />;
  }

  if (!pageModel) {
    return <Result status="warning" title="The form is not found" />;
  }

  return (
    <div style={{ maxWidth: token.screenMD, marginInline: 'auto' }}>
      <PublicFormRuntimeRenderer pageModel={pageModel as FlowModel} />
      <div style={{ marginBlockStart: token.margin }}>
        <PoweredBy />
      </div>
    </div>
  );
}

function InternalPublicFormPage() {
  const params = useParams();
  const app = useApp();
  const t = useT();
  const { token } = theme.useToken();
  const [password, setPassword] = useState('');
  const { data, error, loading, run } = useRequest(
    async (nextPassword?: string) => {
      const response = await app.apiClient.request({
        url: `publicForms:getMeta/${params.name}`,
        skipAuth: true,
        params: nextPassword
          ? {
              password: nextPassword,
            }
          : undefined,
      } as any);
      return getResponseData(response);
    },
    {
      onSuccess(nextData: any) {
        if (nextData?.token) {
          localStorage.setItem(PUBLIC_FORM_TOKEN_KEY, nextData.token);
        }
      },
      refreshDeps: [params.name],
    },
  );

  usePublicFormTokenHeader();
  useApplyPublicDataSource(data);

  useEffect(() => {
    if (data?.title) {
      document.title = data.title;
    }
  }, [data?.title]);

  const passwordRequired = (error as any)?.response?.status === 401 || data?.passwordRequired;

  if (passwordRequired) {
    return (
      <Modal
        centered
        title={t('Password')}
        open
        cancelButtonProps={{ hidden: true }}
        onOk={() => {
          run(password);
        }}
      >
        <Input.Password
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
          }}
        />
      </Modal>
    );
  }

  if ((error as any)?.response?.status >= 500) {
    return <Result status="warning" title={t('The form is not found')} />;
  }

  if (loading) {
    return <Spin />;
  }

  if (!data) {
    return <Result status="info" title={t('The form is not enabled and cannot be accessed')} />;
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: token.colorBgLayout,
        paddingBlock: token.paddingXL,
        paddingInline: token.padding,
      }}
    >
      <PublicFormBody meta={data} />
    </div>
  );
}

export default function PublicFormPage() {
  return <InternalPublicFormPage />;
}
