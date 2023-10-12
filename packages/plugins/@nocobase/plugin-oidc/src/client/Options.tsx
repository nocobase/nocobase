import { CopyOutlined } from '@ant-design/icons';
import { ArrayItems } from '@formily/antd-v5';
import { observer } from '@formily/react';
import { FormItem, Input, SchemaComponent } from '@nocobase/client';
import { Card, Space, message } from 'antd';
import React from 'react';
import { lang, useOidcTranslation } from './locale';

const schema = {
  type: 'object',
  properties: {
    oidc: {
      type: 'object',
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
        http: {
          type: 'boolean',
          title: '{{t("HTTP")}}',
          'x-component': 'Checkbox',
          'x-decorator': 'FormItem',
        },
        port: {
          type: 'number',
          title: '{{t("Port")}}',
          'x-component': 'InputNumber',
          'x-decorator': 'FormItem',
          'x-component-props': {
            style: {
              width: '15%',
              'min-width': '100px',
            },
          },
        },
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
    usage: {
      type: 'void',
      'x-component': 'Usage',
    },
  },
};

const Usage = observer(() => {
  const { t } = useOidcTranslation();

  const { protocol, host } = window.location;
  const url = `${protocol}//${host}/api/oidc:redirect`;

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
});

export const Options = () => {
  const { t } = useOidcTranslation();
  return <SchemaComponent scope={{ t }} components={{ Usage, ArrayItems, Space }} schema={schema} />;
};
