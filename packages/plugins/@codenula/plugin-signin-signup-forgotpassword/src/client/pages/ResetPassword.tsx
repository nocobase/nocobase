import { useForm } from '@formily/react';
import { Plugin, css } from '@nocobase/client';
import { useNavigate, useParams } from 'react-router-dom';
import { ISchema } from '@formily/react';
import { Authenticator, SchemaComponent, SignupPageContext, useSignIn, useAPIClient } from '@nocobase/client';
import React, { useContext } from 'react';

import LogoImg from '../assets/logo.svg';

import CodenulaImg from '../assets/logo-codenula.png';
import RightImg from '../assets/image-login-right.png';

import cloneDeep from 'lodash/cloneDeep';
import { observable } from '@formily/reactive';
import { Observer } from '@formily/react';

const passwordForm: ISchema = {
  type: 'object',
  name: 'passwordForm',
  'x-component': 'FormV2',
  properties: {
    password: {
      type: 'string',
      'x-component': 'Password',
      required: true,
      'x-decorator': 'FormItem',
      'x-component-props': {
        placeholder: '{{"Password"}}',
        style: { backgroundColor: '#e7f0fe', color: 'blue', height: '50px', padding: '10px 19px' },
      },
    },
    reset_password: {
      type: 'string',
      'x-component': 'Password',
      required: true,
      'x-decorator': 'FormItem',
      'x-component-props': {
        placeholder: '{{"Confirm password"}}',
        style: { backgroundColor: '#e7f0fe', color: 'blue', height: '50px', padding: '10px 19px' },
      },
    },
    actions: {
      type: 'void',
      'x-component': 'div',
      properties: {
        submit: {
          title: '{{"Reset password"}}',
          type: 'void',
          'x-component': 'Action',
          'x-component-props': {
            htmlType: 'submit',
            block: true,
            type: 'primary',
            useAction: `{{ useEmailSubmit }}`,
            style: { width: '100%', height: '44px' },
          },
        },
      },
    },
  },
};

const obs = observable({
  isEmailSent: false,
  isOtpVerified: false,
  email: '',
  resetToken: '',
});

//sending otp to email
const useEmailSubmit = () => {
  const form = useForm();

  const api = useAPIClient();

  return {
    async run() {
      await form.submit();
      const values = cloneDeep(form.values);

      console.log(values);
      if (values.password != values.reset_password) {
        window.alert('password do not match');
      } else {
        values.resetToken = obs.resetToken;
        values.email = obs.email;
      }
      await api
        .request({
          url: 'users:resetpassword',
          method: 'post',
          data: { email: values.email, resetToken: values.resetToken, password: values.password },
        })
        .then(async (res) => {
          console.log(res);
          await api.request({
            url: 'email:authEmail',
            method: 'post',
            data: {
              email: values.email,
              page: ['forgotPasswordEmail', 'forgotPasswordEmailSubject'],
            },
          });
          window.location.replace('/');
        })
        .catch((err) => console.log(err));
    },
  };
};
const useVerifyOtp = () => {
  const form = useForm();
  const api = useAPIClient();
};
export const ResetPassword = () => {
  const navigate = useNavigate();
  const params = useParams();
  obs.email = params.email;
  obs.resetToken = params.token;
  const [isEmailVerified, setIsEmailVerified] = React.useState(false);
  const { authType, name, options } = { authType: 'Email/Password', name: 'basic', options: {} };
  const signupPages = useContext(SignupPageContext);
  const allowSignUp = true;
  const signupLink = `/signup?authType=${authType}&name=${name}`;
  const forgotPasswordLink = `/forgotPassword?authType=${authType}&name=${name}`;

  console.log(obs.email, obs.resetToken);
  const useBasicSignIn = () => {
    return useSignIn(name);
  };

  console.log(obs.isEmailSent);
  return (
    <Observer>
      <div>
        <section className="login-box">
          <div className="login-wrapper">
            <div className="login-left">
              <div className="logo-wrap">
                <img src={LogoImg} className="d-lg-block" alt="..." />
              </div>
              <div className="mx-login-left">
                <div className="login-form-box">
                  <div className="login-form-wrapper">
                    <div className="top-headings">
                      <h3 className="main-heading">Welcome! to Your Company Name</h3>
                      <p className="sub-heading">
                        Please enter your email address and password to continue to your account.
                      </p>
                    </div>

                    <SchemaComponent
                      schema={passwordForm}
                      scope={{ useBasicSignIn, allowSignUp, signupLink, forgotPasswordLink, useEmailSubmit }}
                    />
                  </div>
                </div>
              </div>
              <img src={CodenulaImg} className="d-lg-block" alt="..." />
            </div>
            <div className="login-right">
              <div className="login-right-wrap">
                <div className="login-right-top">
                  <h2 className="heading-right">
                    Build Faster <span>together</span>
                  </h2>
                  <p className="right-sub-heading">Conceive, Design and Build processes in the digital age​</p>
                  <p className="summary">
                    No Code Solution CodeNula empowers businesses to create and customize applications without coding,
                    accelerating development and innovation while reducing time-to-market and avoiding technical
                    barriers.
                  </p>
                  <div className="radial-bg">
                    <img src={RightImg} className="img-bg" alt="..." />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* <SchemaComponent schema={passwordForm} scope={{ useBasicSignIn, allowSignUp, signupLink }} /> */}
      </div>
    </Observer>
  );
};
