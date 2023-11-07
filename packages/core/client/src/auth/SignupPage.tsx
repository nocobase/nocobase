import { message } from 'antd';
import React, { useContext, createContext, FunctionComponent, createElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAPIClient, useCurrentDocumentTitle, useViewport } from '..';
import { useForm } from '@formily/react';
import axios from 'axios';
import { Method } from 'axios';
import cloneDeep from 'lodash/cloneDeep';
import CryptoJS from 'crypto-js';


export const SignupPageContext = createContext<{
  [authType: string]: {
    component: FunctionComponent<{
      name: string;
    }>;
  };
}>({});

export const SignupPageProvider: React.FC<{
  authType: string;
  component: FunctionComponent<{
    name: string;
  }>;
}> = (props) => {
  const components = useContext(SignupPageContext);
  components[props.authType] = {
    component: props.component,
  };
  return <SignupPageContext.Provider value={components}>{props.children}</SignupPageContext.Provider>;
};

export interface UseSignupProps {
  authenticator?: string;
  message?: {
    success?: string;
  };
}

export const useSignup = (props?: UseSignupProps) => {
  const navigate = useNavigate();
  const form = useForm();
  const api = useAPIClient();
  const { t } = useTranslation();

  const encryptedString = CryptoJS.AES.encrypt('somerandomstring', 'secret').toString();
  // const token: string = process.env.REACT_APP_SECRET_KEY;
  // console.log(token);

  return {
    async run() {
      await form.submit();
      const response = await api.auth.signUp(form.values, props?.authenticator);


      const values = cloneDeep(form.values);

      const config = {
        url: '/api/email:signupEmail',
        method: 'POST' as Method,
        headers: {
          Authorization: `Bearer ${encryptedString}`,

        },
        data: {
          email: values.email,
          page: ['signupEmail', 'signupEmailSubject'],
        },
      };
      try {
        await axios(config);
      } catch (err) 
        console.log(err);
      }

      message.success(props?.message?.success || t('Sign up successfully, and automatically jump to the sign in page'));
      setTimeout(() => {
        navigate('/signin');
      }, 2000);
    },
  };
};

export const SignupPage = () => {
  const { t } = useTranslation();
  useViewport();
  useCurrentDocumentTitle('Signup');
  const [searchParams] = useSearchParams();
  const authType = searchParams.get('authType');
  const name = searchParams.get('name');
  const signUpPages = useContext(SignupPageContext);
  if (!signUpPages[authType]) {
    return (
      <div>
        <div style={{ color: '#ccc' }}>{t('Oops! The authentication type does not allow sign-up.')}</div>
        <Link to="/signin">{t('Return')}</Link>
      </div>
    );
  }
  return createElement(signUpPages[authType].component, { name });
};
