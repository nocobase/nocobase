import React from 'react';
import { SchemaComponent } from '@nocobase/client';
import { Card, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { observer } from '@formily/react';
import { FormItem, Input } from '@nocobase/client';
import { useOidcTranslation } from './locale';

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
  return <SchemaComponent scope={{ t }} components={{ Usage }} schema={schema} />;
};
