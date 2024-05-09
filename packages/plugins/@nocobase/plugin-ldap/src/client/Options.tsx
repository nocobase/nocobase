/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CopyOutlined } from '@ant-design/icons';
import { observer, useForm } from '@formily/react';
import { FormItem, Input, SchemaComponent, useApp, useRecord } from '@nocobase/client';
import { getSubAppName } from '@nocobase/sdk';
import { Card, message } from 'antd';
import React, { useCallback, useMemo } from 'react';
import { useLdapTranslation } from './locale';

const schema = {
  type: 'object',
  properties: {
    ldap: {
      type: 'object',
      properties: {
        ldapUrl: {
          'x-component': 'Input',
          'x-decorator': 'FormItem',
          title: '{{t("LDAP URL, starts from ldap:// or ldaps://")}}',
          required: true,
        },
        bindDN: {
          'x-component': 'Input',
          'x-decorator': 'FormItem',
          type: 'string',
          title: '{{t("LDAP Username")}}',
          required: true,
        },
        bindPassword: {
          'x-component': 'Input',
          'x-decorator': 'FormItem',
          'x-component-props': {
            type: 'password',
          },
          type: 'string',
          title: '{{t("LDAP Password")}}',
          required: true,
        },
        filter: {
          'x-component': 'Input',
          'x-decorator': 'FormItem',
          type: 'string',
          title: '{{t("LDAP Filter, such as (cn={0})")}}',
          required: true,
        },
        connectTimeout: {
          'x-component': 'Input',
          'x-decorator': 'FormItem',
          type: 'number',
          title: '{{t("Connect Timeout, default value is 5 seconds")}}',
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

const Usage = observer(
  () => {
    const form = useForm();
    const record = useRecord();
    const { t } = useLdapTranslation();

    const app = useApp();
    const name = form.values.name ?? record.name;

    const url = useMemo(() => {
      const appName = getSubAppName(app.getPublicPath()) || 'main';
      return app.getApiUrl(`ldap:redirect?authenticator=${name}&__appName=${appName}`);
    }, [app, name]);

    const copy = useCallback(
      (text: string) => {
        navigator.clipboard.writeText(text);
        message.success(t('Copied'));
      },
      [t],
    );

    return (
      <Card title={t('Usage')} type="inner">
        <FormItem>
          <Input value={url} disabled={true} addonBefore={<CopyOutlined onClick={() => copy(url)} />} />
        </FormItem>
      </Card>
    );
  },
  { displayName: 'Usage' },
);

export const Options = () => {
  const { t } = useLdapTranslation();
  return <SchemaComponent scope={{ t }} components={{ Usage }} schema={schema} />;
};
