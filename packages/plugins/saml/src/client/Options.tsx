import React from 'react';
import { SchemaComponent } from '@nocobase/client';
import { Card, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { observer, useForm } from '@formily/react';
import { useRecord, FormItem, Input } from '@nocobase/client';

const schema = {
  type: 'object',
  properties: {
    saml: {
      type: 'object',
      properties: {
        ssoUrl: {
          title: 'SSO URL',
          'x-component': 'Input',
          'x-decorator': 'FormItem',
          required: true,
        },
        certificate: {
          title: 'Certificate',
          'x-component': 'Input.TextArea',
          'x-decorator': 'FormItem',
          required: true,
        },
        idpIssuer: {
          title: 'idP Issuer',
          'x-component': 'Input',
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

  const name = form.values.name ?? record.name;
  const { protocol, host } = window.location;
  const url = `${protocol}//${host}/api/saml:redirect?authenticator=${name}`;

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    message.success('Copied');
  };

  return (
    <Card title="Usage" type="inner">
      <FormItem label="Issuer">
        <Input value={name} disabled={true} addonBefore={<CopyOutlined onClick={() => copy(name)} />} />
      </FormItem>
      <FormItem label="ACS URL">
        <Input value={url} disabled={true} addonBefore={<CopyOutlined onClick={() => copy(url)} />} />
      </FormItem>
    </Card>
  );
});

export const Options = () => {
  return <SchemaComponent components={{ Usage, Card }} schema={schema} />;
};
