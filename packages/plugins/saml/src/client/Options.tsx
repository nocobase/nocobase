import React from 'react';
import { SchemaComponent } from '@nocobase/client';
import { Card, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { observer, useForm } from '@formily/react';
import { useRecord, FormItem, Input } from '@nocobase/client';
import { useSamlTranslation } from './locale';

const schema = {
  type: 'object',
  properties: {
    saml: {
      type: 'object',
      properties: {
        ssoUrl: {
          title: '{{t("SSO URL")}}',
          'x-component': 'Input',
          'x-decorator': 'FormItem',
          required: true,
        },
        certificate: {
          title: '{{t("Public Certificate")}}',
          'x-component': 'Input.TextArea',
          'x-decorator': 'FormItem',
          required: true,
        },
        idpIssuer: {
          title: 'idP Issuer',
          'x-component': 'Input',
          'x-decorator': 'FormItem',
        },
        http: {
          title: '{{t("http")}}',
          'x-component': 'Checkbox',
          'x-decorator': 'FormItem',
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
  const form = useForm();
  const record = useRecord();
  const { t } = useSamlTranslation();

  const name = form.values.name ?? record.name;
  const { protocol, host } = window.location;
  const url = `${protocol}//${host}/api/saml:redirect?authenticator=${name}`;

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    message.success(t('Copied'));
  };

  return (
    <Card title={t('Usage')} type="inner">
      <FormItem label={t('SP Issuer/EntityID')}>
        <Input value={name} disabled={true} addonBefore={<CopyOutlined onClick={() => copy(name)} />} />
      </FormItem>
      <FormItem label={t('ACS URL')}>
        <Input value={url} disabled={true} addonBefore={<CopyOutlined onClick={() => copy(url)} />} />
      </FormItem>
    </Card>
  );
});

export const Options = () => {
  const { t } = useSamlTranslation();
  return <SchemaComponent scope={{ t }} components={{ Usage }} schema={schema} />;
};
