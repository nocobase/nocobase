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
  useAPIClient,
  useActionContext,
  useCurrentUserSettingsMenu,
  usePlugin,
  useRequest,
} from '@nocobase/client';
import React, { createContext, createElement, useContext, useEffect, useMemo, useState } from 'react';
import { MenuProps, List, Tag, message, Tabs } from 'antd';
import { uid } from '@formily/shared';
import { Schema, useForm } from '@formily/react';
import { useVerificationTranslation } from './locale';
import PluginVerificationClient from '.';
import { createForm } from '@formily/core';

export const UserVerificatorsContext = createContext<{
  refresh: () => void;
}>(null);

const useBindActionProps = (verificator: string) => {
  const form = useForm();
  const api = useAPIClient();
  const { t } = useVerificationTranslation();
  const { refresh } = useContext(UserVerificatorsContext);
  const { setVisible } = useActionContext();

  return {
    type: 'primary',
    htmlType: 'submit',
    onClick: async () => {
      await form.submit();
      await api.resource('verificators').bind({
        values: {
          verificator,
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
  const { refresh } = useContext(UserVerificatorsContext);
  const { setVisible } = useActionContext();

  return {
    type: 'primary',
    htmlType: 'submit',
    onClick: async () => {
      await form.submit();
      await api.resource('verificators').unbind({
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

const useFormProps = (verificator: string, unbindVerificator: string) => {
  const form = useMemo(
    () =>
      createForm({
        initialValues: {
          verificator,
          unbindVerificator,
        },
      }),
    [verificator, unbindVerificator],
  );
  return {
    form,
  };
};

const BindModal: React.FC<{
  verificator: {
    name: string;
    title: string;
    verificationType: string;
  };
}> = ({ verificator }) => {
  const { t } = useVerificationTranslation();
  const plugin = usePlugin('verification') as PluginVerificationClient;
  if (!verificator) {
    return null;
  }
  const verification = plugin.verificationManager.getVerification(verificator.verificationType);
  const C = verification?.components?.BindForm;

  return (
    <SchemaComponent
      components={{ C }}
      scope={{ useBindActionProps: () => useBindActionProps(verificator.name), useCancelActionProps }}
      schema={{
        type: 'void',
        properties: {
          [uid()]: {
            type: 'object',
            'x-component': 'Action.Modal',
            'x-component-props': {
              width: 520,
            },
            title: t(verificator.title),
            'x-decorator': 'FormV2',
            properties: {
              form: {
                type: 'void',
                'x-component': 'C',
                'x-component-props': {
                  verificator: verificator.name,
                  actionType: 'verificators:bind',
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
  verificators: any[];
  unbindVerificator: string;
}> = ({ verificators, unbindVerificator }) => {
  const { t } = useVerificationTranslation();
  const plugin = usePlugin('verification') as PluginVerificationClient;

  const tabs = verificators
    .map((verificator) => {
      const verification = plugin.verificationManager.getVerification(verificator.verificationType);
      const C = verification?.components?.VerificationForm;
      if (!C) {
        return;
      }
      const defaultTabTitle = Schema.compile(verificator.verificationTypeTitle || verificator.verificationType, { t });
      return {
        component: (
          <SchemaComponent
            components={{ C }}
            scope={{
              useCancelActionProps,
              useUnbindActionProps,
              useFormProps: () => useFormProps(verificator.name, unbindVerificator),
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
                        actionType: 'verificators:unbind',
                        verificator: verificator.name,
                        boundInfo: verificator.boundInfo,
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
        tabTitle: verificator.title || defaultTabTitle,
        ...verificator,
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
  verificator: {
    name: string;
    title: string;
    verificationType: string;
  };
}> = ({ verificator }) => {
  const { t } = useVerificationTranslation();
  const api = useAPIClient();
  const { data: verificators, loading } = useRequest<any[]>(
    () =>
      api
        .resource('verificators')
        .listForVerify({
          scene: 'unbind-verificator',
        })
        .then((res) => res?.data?.data),
    {
      refreshDeps: [verificator],
    },
  );

  if (!verificator || loading) {
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
            title: t('Unbind verificator'),
            properties: {
              [uid()]: {
                type: 'void',
                'x-component': 'UnbindForm',
                'x-component-props': {
                  verificators,
                  unbindVerificator: verificator.name,
                },
              },
            },
          },
        },
      }}
    />
  );
};

const Verificators: React.FC = () => {
  const { t } = useVerificationTranslation();
  const api = useAPIClient();
  const { data, refresh } = useRequest(() =>
    api
      .resource('verificators')
      .listByUser()
      .then((res) => res?.data?.data),
  );
  const [openBindModal, setOpenBindModal] = useState(false);
  const [openUnbindModal, setOpenUnbindModal] = useState(false);
  const [verificator, setVerificator] = useState(null);
  const setBindInfo = (item: any) => {
    setOpenBindModal(true);
    setVerificator(item);
  };
  const setUnbindInfo = (item: any) => {
    setOpenUnbindModal(true);
    setVerificator(item);
  };

  return (
    <UserVerificatorsContext.Provider value={{ refresh }}>
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
        {openBindModal ? <BindModal verificator={verificator} /> : null}
      </ActionContextProvider>
      <ActionContextProvider value={{ visible: openUnbindModal, setVisible: setOpenUnbindModal }}>
        {openUnbindModal ? <UnbindModal verificator={verificator} /> : null}
      </ActionContextProvider>
    </UserVerificatorsContext.Provider>
  );
};

const Verification: React.FC = () => {
  const { t } = useVerificationTranslation();
  const ctx = useContext(DropdownVisibleContext);
  const [visible, setVisible] = useState(false);
  return (
    <div
      onClick={() => {
        ctx?.setVisible(false);
        setVisible(true);
      }}
    >
      {t('Verification')}
      <ActionContextProvider value={{ visible, setVisible }}>
        <div onClick={(e) => e.stopPropagation()}>
          <SchemaComponent
            components={{ Verificators }}
            schema={{
              type: 'object',
              properties: {
                [uid()]: {
                  'x-component': 'Action.Drawer',
                  'x-component-props': {
                    zIndex: 2000,
                  },
                  type: 'void',
                  title: '{{t("Verification")}}',
                  properties: {
                    form: {
                      type: 'void',
                      'x-component': 'Verificators',
                    },
                  },
                },
              },
            }}
          />
        </div>
      </ActionContextProvider>
    </div>
  );
};

export const useVerificationMenu = () => {
  const result = useMemo<MenuProps['items'][0]>(() => {
    return {
      key: 'verification',
      eventKey: 'verification',
      label: <Verification />,
    };
  }, []);
  return result;
};

export const VerificationMenuProvider: React.FC = (props) => {
  const { addMenuItem } = useCurrentUserSettingsMenu();
  const verificationItem = useVerificationMenu();

  useEffect(() => {
    addMenuItem(verificationItem, { after: 'role' });
  }, [addMenuItem, verificationItem]);
  return <>{props.children}</>;
};
