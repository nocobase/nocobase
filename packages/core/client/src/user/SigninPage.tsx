import { ISchema, useForm } from '@formily/react';
import { Tabs } from 'antd';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useHistory, useLocation } from 'react-router-dom';
import { SchemaComponent, useAPIClient, useCurrentDocumentTitle, useSystemSettings } from '..';
import VerificationCode from './VerificationCode';

const passwordForm: ISchema = {
  type: 'object',
  name: 'passwordForm',
  'x-component': 'FormV2',
  properties: {
    email: {
      type: 'string',
      required: true,
      'x-component': 'Input',
      'x-validator': 'email',
      'x-decorator': 'FormItem',
      'x-component-props': { placeholder: '{{t("Email")}}', style: {} },
    },
    password: {
      type: 'string',
      'x-component': 'Password',
      required: true,
      'x-decorator': 'FormItem',
      'x-component-props': { placeholder: '{{t("Password")}}', style: {} },
    },
    actions: {
      type: 'void',
      'x-component': 'div',
      properties: {
        submit: {
          title: '{{t("Sign in")}}',
          type: 'void',
          'x-component': 'Action',
          'x-component-props': {
            htmlType: 'submit',
            block: true,
            type: 'primary',
            useAction: '{{ usePasswordSignIn }}',
            style: { width: '100%' },
          },
        },
      },
    },
  },
};

function useRedirect(next = '/admin') {
  const location = useLocation<any>();
  const history = useHistory();
  const redirect = location?.['query']?.redirect;
  return useCallback(() => {
    history.push(redirect || '/admin');
  }, [redirect]);
}

export const usePasswordSignIn = () => {
  const form = useForm();
  const api = useAPIClient();
  const redirect = useRedirect();
  return {
    async run() {
      await form.submit();
      await api.auth.signIn(form.values);
      redirect();
    },
  };
};

const phoneForm: ISchema = {
  type: 'object',
  name: 'phoneForm',
  'x-component': 'Form',
  properties: {
    phone: {
      type: 'string',
      required: true,
      'x-component': 'Input',
      'x-validator': 'phone',
      'x-decorator': 'FormItem',
      'x-component-props': { placeholder: '{{t("Phone")}}', style: {} },
    },
    code: {
      type: 'string',
      required: true,
      'x-component': 'VerificationCode',
      'x-component-props': {
        actionType: 'users:signin',
        targetFieldName: 'phone',
      },
      'x-decorator': 'FormItem',
    },
    actions: {
      title: '{{t("Sign in")}}',
      type: 'void',
      'x-component': 'Action',
      'x-component-props': {
        htmlType: 'submit',
        block: true,
        type: 'primary',
        useAction: '{{ usePhoneSignIn }}',
        style: { width: '100%' },
      },
    },
  },
};

export function usePhoneSignIn() {
  const form = useForm();
  const api = useAPIClient();
  const redirect = useRedirect();
  return {
    async run() {
      await form.submit();
      await api.auth.signIn(form.values, 'sms');
      redirect();
    },
  };
}

export interface SigninPageProps {
  schema?: ISchema;
  components?: any;
  scope?: any;
}

export const SigninPage = (props: SigninPageProps) => {
  const { t } = useTranslation();
  useCurrentDocumentTitle('Signin');
  const ctx = useSystemSettings();
  const { allowSignUp, smsAuthEnabled } = ctx?.data?.data || {};
  const { schema, components, scope } = props;
  return (
    <div>
      {smsAuthEnabled ? (
        <Tabs defaultActiveKey="password">
          <Tabs.TabPane tab={t('Sign in via account')} key="password">
            <SchemaComponent scope={{ usePasswordSignIn }} schema={schema || passwordForm} />
          </Tabs.TabPane>
          <Tabs.TabPane tab={t('Sign in via phone')} key="phone">
            <SchemaComponent
              schema={phoneForm}
              scope={{ usePhoneSignIn, ...scope }}
              components={{
                VerificationCode,
                ...components,
              }}
            />
          </Tabs.TabPane>
        </Tabs>
      ) : (
        <SchemaComponent
          components={{ ...components }}
          scope={{ usePasswordSignIn, ...scope }}
          schema={schema || passwordForm}
        />
      )}
      {allowSignUp && (
        <div>
          <Link to="/signup">{t('Create an account')}</Link>
        </div>
      )}
    </div>
  );
};
