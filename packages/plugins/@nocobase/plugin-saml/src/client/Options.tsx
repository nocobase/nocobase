import React from 'react';
import { SchemaComponent } from '@nocobase/client';
import { Card, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { observer, useForm } from '@formily/react';
import { useRecord, FormItem, Input } from '@nocobase/client';
import { lang, useSamlTranslation } from './locale';
import { getSubAppName } from '@nocobase/sdk';

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
  const form = useForm();
  const record = useRecord();
  const { t } = useSamlTranslation();

  const app = getSubAppName() || 'main';
  const name = form.values.name ?? record.name;
  const { protocol, host } = window.location;
  const url = `${protocol}//${host}/api/saml:redirect?authenticator=${name}&__appName=${app}`;

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
