/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  ActionContextProvider,
  DropdownVisibleContext,
  SchemaComponent,
  SchemaSettingsItem,
  useAPIClient,
  useActionContext,
  usePlugin,
  useRequest,
  useZIndexContext,
  zIndexContext,
} from '@nocobase/client';
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { List, Tag, message, Tabs } from 'antd';
import { uid } from '@formily/shared';
import { Schema, useForm } from '@formily/react';
import { useVerificationTranslation } from './locale';
import PluginVerificationClient from '.';
import { createForm } from '@formily/core';

export const UserVerifiersContext = createContext<{
  refresh: () => void;
}>(null);

const useBindActionProps = (verifier: string) => {
  const form = useForm();
  const api = useAPIClient();
  const { t } = useVerificationTranslation();
  const { refresh } = useContext(UserVerifiersContext);
  const { setVisible } = useActionContext();

  return {
    type: 'primary',
    htmlType: 'submit',
    onClick: async () => {
      await form.submit();
      await api.resource('verifiers').bind({
        values: {
          verifier,
          ...form.values,
        },
      });
      message.success(t('Bound successfully'));
      setVisible(false);
      refresh();
    },
  };
};

const useUnbindActionProps = () => {
  const form = useForm();
  const api = useAPIClient();
  const { t } = useVerificationTranslation();
  const { refresh } = useContext(UserVerifiersContext);
  const { setVisible } = useActionContext();

  return {
    type: 'primary',
    htmlType: 'submit',
    onClick: async () => {
      await form.submit();
      await api.resource('verifiers').unbind({
        values: {
          ...form.values,
        },
      });
      message.success(t('Unbound successfully'));
      setVisible(false);
      refresh();
    },
  };
};

const useCancelActionProps = () => {
  const { setVisible } = useActionContext();
  return {
    onClick: () => {
      setVisible(false);
    },
  };
};

const useFormProps = (verifier: string, unbindVerifier: string) => {
  const form = useMemo(
    () =>
      createForm({
        initialValues: {
          verifier,
          unbindVerifier,
        },
      }),
    [verifier, unbindVerifier],
  );
  return {
    form,
  };
};

const BindModal: React.FC<{
  verifier: {
    name: string;
    title: string;
    verificationType: string;
  };
}> = ({ verifier }) => {
  const { t } = useVerificationTranslation();
  const plugin = usePlugin('verification') as PluginVerificationClient;
  if (!verifier) {
    return null;
  }
  const verification = plugin.verificationManager.getVerification(verifier.verificationType);
  const C = verification?.components?.BindForm;

  return (
    <SchemaComponent
      components={{ C }}
      scope={{ useBindActionProps: () => useBindActionProps(verifier.name), useCancelActionProps }}
      schema={{
        type: 'void',
        properties: {
          [uid()]: {
            type: 'object',
            'x-component': 'Action.Modal',
            'x-component-props': {
              width: 520,
            },
            title: t(verifier.title),
            'x-decorator': 'FormV2',
            properties: {
              form: {
                type: 'void',
                'x-component': 'C',
                'x-component-props': {
                  verifier: verifier.name,
                  actionType: 'verifiers:bind',
                  isLogged: true,
                },
              },
              footer: {
                type: 'void',
                'x-component': 'Action.Modal.Footer',
                properties: {
                  close: {
                    title: t('Cancel'),
                    'x-component': 'Action',
                    'x-component-props': {
                      type: 'default',
                    },
                    'x-use-component-props': 'useCancelActionProps',
                  },
                  submit: {
                    title: t('Bind'),
                    'x-component': 'Action',
                    'x-use-component-props': 'useBindActionProps',
                  },
                },
              },
            },
          },
        },
      }}
    />
  );
};

const UnbindForm: React.FC<{
  verifiers: any[];
  unbindVerifier: string;
}> = ({ verifiers, unbindVerifier }) => {
  const { t } = useVerificationTranslation();
  const plugin = usePlugin('verification') as PluginVerificationClient;

  const tabs = verifiers
    .map((verifier) => {
      const verification = plugin.verificationManager.getVerification(verifier.verificationType);
      const C = verification?.components?.VerificationForm;
      if (!C) {
        return;
      }
      const defaultTabTitle = Schema.compile(verifier.verificationTypeTitle || verifier.verificationType, { t });
      return {
        component: (
          <SchemaComponent
            components={{ C }}
            scope={{
              useCancelActionProps,
              useUnbindActionProps,
              useFormProps: () => useFormProps(verifier.name, unbindVerifier),
            }}
            schema={{
              type: 'void',
              properties: {
                form: {
                  type: 'object',
                  'x-component': 'FormV2',
                  'x-use-component-props': 'useFormProps',
                  properties: {
                    bind: {
                      type: 'void',
                      'x-component': 'C',
                      'x-component-props': {
                        actionType: 'verifiers:unbind',
                        verifier: verifier.name,
                        boundInfo: verifier.boundInfo,
                        isLogged: true,
                      },
                    },
                    footer: {
                      type: 'void',
                      'x-component': 'Action.Modal.FootBar',
                      properties: {
                        close: {
                          title: t('Cancel'),
                          'x-component': 'Action',
                          'x-component-props': {
                            type: 'default',
                          },
                          'x-use-component-props': 'useCancelActionProps',
                        },
                        submit: {
                          title: t('Unbind'),
                          'x-component': 'Action',
                          'x-use-component-props': 'useUnbindActionProps',
                        },
                      },
                    },
                  },
                },
              },
            }}
          />
        ),
        tabTitle: verifier.title || defaultTabTitle,
        ...verifier,
      };
    })
    .filter((i) => i);

  return (
    <>
      {tabs.length ? (
        <Tabs
          destroyInactiveTabPane={true}
          items={tabs.map((tab) => ({ label: tab.tabTitle, key: tab.name, children: tab.component }))}
        />
      ) : null}
    </>
  );
};

const UnbindModal: React.FC<{
  verifier: {
    name: string;
    title: string;
    verificationType: string;
  };
}> = ({ verifier }) => {
  const { t } = useVerificationTranslation();
  const api = useAPIClient();
  const { data: verifiers, loading } = useRequest<any[]>(
    () =>
      api
        .resource('verifiers')
        .listForVerify({
          scene: 'unbind-verifier',
        })
        .then((res) => res?.data?.data),
    {
      refreshDeps: [verifier],
    },
  );

  if (!verifier || loading) {
    return null;
  }

  return (
    <SchemaComponent
      components={{ UnbindForm }}
      schema={{
        type: 'void',
        properties: {
          [uid()]: {
            type: 'object',
            'x-component': 'Action.Modal',
            'x-component-props': {
              width: 520,
            },
            title: t('Unbind verifier'),
            properties: {
              [uid()]: {
                type: 'void',
                'x-component': 'UnbindForm',
                'x-component-props': {
                  verifiers,
                  unbindVerifier: verifier.name,
                },
              },
            },
          },
        },
      }}
    />
  );
};

const Verifiers: React.FC = () => {
  const { t } = useVerificationTranslation();
  const api = useAPIClient();
  const { data, refresh } = useRequest(() =>
    api
      .resource('verifiers')
      .listByUser()
      .then((res) => res?.data?.data),
  );
  const [openBindModal, setOpenBindModal] = useState(false);
  const [openUnbindModal, setOpenUnbindModal] = useState(false);
  const [verifier, setVerifier] = useState(null);
  const setBindInfo = (item: any) => {
    setOpenBindModal(true);
    setVerifier(item);
  };
  const setUnbindInfo = (item: any) => {
    setOpenUnbindModal(true);
    setVerifier(item);
  };

  return (
    <UserVerifiersContext.Provider value={{ refresh }}>
      <List
        bordered
        dataSource={data as any}
        renderItem={(item: {
          title: string;
          description?: string;
          boundInfo?: { bound: boolean; publicInfo?: string };
        }) => (
          <List.Item
            actions={
              item.boundInfo?.bound
                ? [
                    <a key="unbind" onClick={() => setUnbindInfo(item)}>
                      {t('Unbind')}
                    </a>,
                  ]
                : [
                    <a key="bind" onClick={() => setBindInfo(item)}>
                      {t('Bind')}
                    </a>,
                  ]
            }
          >
            <List.Item.Meta
              title={
                <>
                  {Schema.compile(item.title, { t })}
                  {item.boundInfo?.bound ? (
                    <Tag color="success" style={{ marginLeft: '10px' }}>
                      {t('Configured')}
                    </Tag>
                  ) : (
                    <Tag color="warning" style={{ marginLeft: '10px' }}>
                      {t('Not configured')}
                    </Tag>
                  )}
                </>
              }
              description={Schema.compile(item.description, { t })}
            />
            <div style={{ marginLeft: '10px' }}>{item.boundInfo?.publicInfo}</div>
          </List.Item>
        )}
      />
      <ActionContextProvider value={{ visible: openBindModal, setVisible: setOpenBindModal }}>
        {openBindModal ? <BindModal verifier={verifier} /> : null}
      </ActionContextProvider>
      <ActionContextProvider value={{ visible: openUnbindModal, setVisible: setOpenUnbindModal }}>
        {openUnbindModal ? <UnbindModal verifier={verifier} /> : null}
      </ActionContextProvider>
    </UserVerifiersContext.Provider>
  );
};

export const Verification = () => {
  const ctx = useContext(DropdownVisibleContext);
  const [visible, setVisible] = useState(false);
  const { t } = useVerificationTranslation();
  const parentZIndex = useZIndexContext();
  const zIndex = parentZIndex + 10;

  // 避免重复渲染的 click 处理
  const handleClick = useCallback(
    (e) => {
      e.stopPropagation();
      ctx?.setVisible?.(false);
      setVisible((prev) => (prev ? prev : true)); // 只有 `visible` 变化时才触发更新
    },
    [ctx],
  );

  // 避免 `SchemaComponent` 结构重新创建
  const schemaComponent = useMemo(() => {
    return (
      <SchemaComponent
        components={{ Verifiers }}
        schema={{
          type: 'object',
          properties: {
            [uid()]: {
              'x-component': 'Action.Drawer',
              'x-component-props': { zIndex },
              type: 'void',
              title: '{{t("Verification")}}',
              properties: {
                form: {
                  type: 'void',
                  'x-component': 'Verifiers',
                },
              },
            },
          },
        }}
      />
    );
  }, [zIndex]);

  return (
    <zIndexContext.Provider value={zIndex}>
      <SchemaSettingsItem eventKey="Verification" title="Verification">
        <div onClick={handleClick}>{t('Verification')}</div>
      </SchemaSettingsItem>
      <ActionContextProvider value={{ visible, setVisible }}>
        {visible && <div onClick={(e) => e.stopPropagation()}>{schemaComponent}</div>}
      </ActionContextProvider>
    </zIndexContext.Provider>
  );
};
