import React from 'react';
import { SchemaComponent } from '@nocobase/client';
import { Card, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { observer } from '@formily/react';
import { FormItem, Input } from '@nocobase/client';
import { useOidcTranslation } from './locale';
import { ArrayItems } from '@formily/antd';

const schema = {
  type: 'object',
  properties: {
    oidc: {
      type: 'object',
      properties: {
        issuer: {
          title: '{{t("Issuer")}}',
          'x-component': 'Input',
          'x-decorator': 'FormItem',
          required: true,
        },
        clientId: {
          title: '{{t("Client ID")}}',
          'x-component': 'Input',
          'x-decorator': 'FormItem',
          required: true,
        },
        clientSecret: {
          title: '{{t("Client Secret")}}',
          'x-component': 'Input',
          'x-decorator': 'FormItem',
          required: true,
        },
        scope: {
          title: '{{t("scope")}}',
          'x-component': 'Input',
          'x-decorator': 'FormItem',
          'x-decorator-props': {
            tooltip: '{{t("Default: openid profile email")}}',
          },
        },
        http: {
          title: '{{t("http")}}',
          'x-component': 'Checkbox',
          'x-decorator': 'FormItem',
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
              source: {
                type: 'string',
                title: '{{t("source")}}',
                'x-decorator': 'Editable',
                'x-component': 'Input',
                'x-component-props': {
                  placeholder: '{{t("source")}}',
                },
                'x-decorator-props': {
                  style: {
                    width: '45%',
                  },
                },
              },
              target: {
                type: 'string',
                title: '{{t("target")}}',
                'x-decorator': 'Editable',
                'x-component': 'Select',
                'x-component-props': {
                  placeholder: '{{t("target")}}',
                },
                'x-decorator-props': {
                  style: {
                    width: '45%',
                  },
                },
                enum: [
                  { label: 'Nickname', value: 'nickname' },
                  { label: 'Email', value: 'email' },
                  { label: 'Phone', value: 'phone' },
                ],
              },
              remove: {
                type: 'void',
                'x-decorator': 'FormItem',
                'x-component': 'ArrayItems.Remove',
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
        usage: {
          type: 'void',
          'x-component': 'Usage',
        },
      },
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
  return <SchemaComponent scope={{ t }} components={{ Usage, ArrayItems }} schema={schema} />;
};
