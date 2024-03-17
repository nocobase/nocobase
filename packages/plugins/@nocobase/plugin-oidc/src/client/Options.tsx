import { CopyOutlined } from '@ant-design/icons';
import { ArrayItems, FormTab } from '@formily/antd-v5';
import { observer } from '@formily/react';
import { FormItem, Input, SchemaComponent, useApp } from '@nocobase/client';
import { Card, Space, message } from 'antd';
import React, { useMemo } from 'react';
import { lang, useOidcTranslation } from './locale';

const schema = {
  type: 'object',
  properties: {
    public: {
      type: 'object',
      properties: {
        autoSignup: {
          'x-decorator': 'FormItem',
          type: 'boolean',
          title: '{{t("Sign up automatically when the user does not exist")}}',
          'x-component': 'Checkbox',
          default: true,
        },
      },
    },
    oidc: {
      type: 'object',
      properties: {
        collapse: {
          type: 'void',
          'x-component': 'FormTab',
          properties: {
            basic: {
              type: 'void',
              'x-component': 'FormTab.TabPane',
              'x-component-props': {
                tab: lang('Basic configuration'),
              },
              properties: {
                issuer: {
                  type: 'string',
                  title: '{{t("Issuer")}}',
                  'x-component': 'Input',
                  'x-decorator': 'FormItem',
                  required: true,
                },
                clientId: {
                  type: 'string',
                  title: '{{t("Client ID")}}',
                  'x-component': 'Input',
                  'x-decorator': 'FormItem',
                  required: true,
                },
                clientSecret: {
                  type: 'string',
                  title: '{{t("Client Secret")}}',
                  'x-component': 'Input',
                  'x-decorator': 'FormItem',
                  required: true,
                },
                scope: {
                  type: 'string',
                  title: '{{t("scope")}}',
                  'x-component': 'Input',
                  'x-decorator': 'FormItem',
                  'x-decorator-props': {
                    tooltip: '{{t("Default: openid profile email")}}',
                  },
                },
                idTokenSignedResponseAlg: {
                  type: 'string',
                  title: '{{t("id_token signed response algorithm")}}',
                  'x-component': 'Select',
                  'x-decorator': 'FormItem',
                  enum: [
                    { label: 'HS256', value: 'HS256' },
                    { label: 'HS384', value: 'HS384' },
                    { label: 'HS512', value: 'HS512' },
                    { label: 'RS256', value: 'RS256' },
                    { label: 'RS384', value: 'RS384' },
                    { label: 'RS512', value: 'RS512' },
                    { label: 'ES256', value: 'ES256' },
                    { label: 'ES384', value: 'ES384' },
                    { label: 'ES512', value: 'ES512' },
                    { label: 'PS256', value: 'PS256' },
                    { label: 'PS384', value: 'PS384' },
                    { label: 'PS512', value: 'PS512' },
                  ],
                },
              },
            },
            mapping: {
              type: 'void',
              'x-component': 'FormTab.TabPane',
              'x-component-props': {
                tab: lang('Field mapping'),
              },
              properties: {
                fieldMap: {
                  title: '{{t("Field Map")}}',
                  type: 'array',
                  'x-decorator': 'FormItem',
                  'x-component': 'ArrayItems',
                  items: {
                    type: 'object',
                    'x-decorator': 'ArrayItems.Item',
                    properties: {
                      space: {
                        type: 'void',
                        'x-component': 'Space',
                        properties: {
                          source: {
                            type: 'string',
                            'x-decorator': 'FormItem',
                            'x-component': 'Input',
                            'x-component-props': {
                              placeholder: '{{t("source")}}',
                            },
                          },
                          target: {
                            type: 'string',
                            'x-decorator': 'FormItem',
                            'x-component': 'Select',
                            'x-component-props': {
                              placeholder: '{{t("target")}}',
                            },
                            enum: [
                              { label: lang('Nickname'), value: 'nickname' },
                              { label: lang('Email'), value: 'email' },
                              { label: lang('Phone'), value: 'phone' },
                              { label: lang('Username'), value: 'username' },
                            ],
                          },
                          remove: {
                            type: 'void',
                            'x-decorator': 'FormItem',
                            'x-component': 'ArrayItems.Remove',
                          },
                        },
                      },
                    },
                  },
                  properties: {
                    add: {
                      type: 'void',
                      title: 'Add',
                      'x-component': 'ArrayItems.Addition',
                    },
                  },
                },
                userBindField: {
                  type: 'string',
                  title: '{{t("Use this field to bind the user")}}',
                  'x-component': 'Select',
                  'x-decorator': 'FormItem',
                  default: 'email',
                  enum: [
                    { label: lang('Email'), value: 'email' },
                    { label: lang('Username'), value: 'username' },
                  ],
                  required: true,
                },
              },
            },
            advanced: {
              type: 'void',
              'x-component': 'FormTab.TabPane',
              'x-component-props': {
                tab: lang('Advanced configuration'),
              },
              properties: {
                http: {
                  type: 'boolean',
                  title: '{{t("HTTP")}}',
                  'x-component': 'Checkbox',
                  'x-decorator': 'FormItem',
                  'x-decorator-props': {
                    tooltip: '{{t("Check if NocoBase is running on HTTP protocol")}}',
                  },
                },
                port: {
                  type: 'number',
                  title: '{{t("Port")}}',
                  'x-component': 'InputNumber',
                  'x-decorator': 'FormItem',
                  'x-decorator-props': {
                    tooltip: '{{t("The port number of the NocoBase service if it is not 80 or 443")}}',
                  },
                  'x-component-props': {
                    style: {
                      width: '15%',
                      minWidth: '100px',
                    },
                  },
                },
                stateToken: {
                  type: 'string',
                  title: '{{t("State token")}}',
                  'x-component': 'Input',
                  'x-decorator': 'FormItem',
                  description: lang(
                    "The state token helps prevent CSRF attacks. It's recommended to leave it blank for automatic random generation.",
                  ),
                },
                exchangeBodyKeys: {
                  type: 'array',
                  title: '{{t("Pass parameters in the authorization code grant exchange")}}',
                  'x-decorator': 'FormItem',
                  'x-component': 'ArrayItems',
                  default: [
                    { paramName: '', optionsKey: 'clientId' },
                    {
                      paramName: '',
                      optionsKey: 'clientSecret',
                    },
                  ],
                  items: {
                    type: 'object',
                    'x-decorator': 'ArrayItems.Item',
                    properties: {
                      space: {
                        type: 'void',
                        'x-component': 'Space',
                        properties: {
                          enabled: {
                            type: 'boolean',
                            'x-decorator': 'FormItem',
                            'x-component': 'Checkbox',
                          },
                          optionsKey: {
                            type: 'string',
                            'x-decorator': 'FormItem',
                            'x-decorator-props': {
                              style: {
                                width: '100px',
                              },
                            },
                            'x-component': 'Select',
                            'x-read-pretty': true,
                            enum: [
                              { label: lang('Client ID'), value: 'clientId' },
                              { label: lang('Client Secret'), value: 'clientSecret' },
                            ],
                          },
                          paramName: {
                            type: 'string',
                            'x-decorator': 'FormItem',
                            'x-component': 'Input',
                            'x-component-props': {
                              placeholder: '{{t("Parameter name")}}',
                            },
                          },
                        },
                      },
                    },
                  },
                },
                userInfoMethod: {
                  type: 'string',
                  title: '{{t("Method to call the user info endpoint")}}',
                  'x- decorator': 'FormItem',
                  'x-component': 'Radio.Group',
                  default: 'GET',
                  enum: [
                    {
                      label: 'GET',
                      value: 'GET',
                    },
                    {
                      label: 'POST',
                      value: 'POST',
                    },
                  ],
                  'x-reactions': [
                    {
                      dependencies: ['.accessTokenVia'],
                      when: '{{$deps[0] === "query"}}',
                      fulfill: {
                        state: {
                          value: 'GET',
                        },
                      },
                    },
                    {
                      dependencies: ['.accessTokenVia'],
                      when: '{{$deps[0] === "body"}}',
                      fulfill: {
                        state: {
                          value: 'POST',
                        },
                      },
                    },
                  ],
                },
                accessTokenVia: {
                  type: 'string',
                  title: '{{t("Where to put the access token when calling the user info endpoint")}}',
                  'x- decorator': 'FormItem',
                  'x-component': 'Radio.Group',
                  default: 'header',
                  enum: [
                    {
                      label: lang('Header'),
                      value: 'header',
                    },
                    {
                      label: lang('Body (Use with POST method)'),
                      value: 'body',
                    },
                    {
                      label: lang('Query parameters (Use with GET method)'),
                      value: 'query',
                    },
                  ],
                },
              },
            },
          },
        },
      },
    },
    usage: {
      type: 'void',
      'x-component': 'Usage',
    },
  },
};

const Usage = observer(
  () => {
    const { t } = useOidcTranslation();
    const app = useApp();

    const url = useMemo(() => {
      const options = app.getOptions();
      const apiBaseURL: string = options?.apiClient?.['baseURL'];
      const { protocol, host } = window.location;
      return apiBaseURL.startsWith('http')
        ? `${apiBaseURL}oidc:redirect`
        : `${protocol}//${host}${apiBaseURL}oidc:redirect`;
    }, [app]);

    const copy = (text: string) => {
      navigator.clipboard.writeText(text);
      message.success(t('Copied'));
    };

    return (
      <Card title={t('Usage')} type="inner">
        <FormItem label={t('Redirect URL')}>
          <Input value={url} disabled={true} addonBefore={<CopyOutlined onClick={() => copy(url)} />} />
        </FormItem>
      </Card>
    );
  },
  { displayName: 'Usage' },
);

export const Options = () => {
  const { t } = useOidcTranslation();
  return <SchemaComponent scope={{ t }} components={{ Usage, ArrayItems, Space, FormTab }} schema={schema} />;
};
