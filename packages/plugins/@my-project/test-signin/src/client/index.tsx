import { useForm } from '@formily/react';
import { Plugin, css } from '@nocobase/client';

import { ISchema } from '@formily/react';
import { Authenticator, SchemaComponent, SignupPageContext, useSignIn } from '@nocobase/client';
import React, { useContext } from 'react';
import './signin.css';
import './assets/icomoon/icomoon.css';
import LogoImg from './assets/logo.svg';
import ArrowImg from './assets/arrow-r.svg';
import CodenulaImg from './assets/logo-codenula.png';
import RightImg from './assets/image-login-right.png';

const passwordForm: ISchema = {
  type: 'object',
  name: 'passwordForm',
  'x-component': 'FormV2',
  properties: {
    account: {
      type: 'string',
      'x-component': 'Input',
      'x-validator': `{{(value) => {
        if (!value) {
          return "Please enter your username or email";
        }
        if (value.includes('@')) {
          if (!/^[\\w-]+(\\.[\\w-]+)*@[\\w-]+(\\.[\\w-]+)+$/.test(value)) {
            return "Please enter a valid email";
          }
        } else {
          return /^[^@.<>"'/]{2,16}$/.test(value) || "Please enter a valid username";
        }
      }}}`,
      'x-decorator': 'FormItem',
      'x-component-props': {
        placeholder: '{{"Username/Email"}}',
        style: { backgroundColor: '#e7f0fe', color: 'blue', height: '50px', padding: '10px 19px' },
      },
    },
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
    actions: {
      type: 'void',
      'x-component': 'div',
      properties: {
        submit: {
          title: '{{"Sign in"}}',
          type: 'void',
          'x-component': 'Action',
          'x-component-props': {
            htmlType: 'submit',
            block: true,
            type: 'primary',
            useAction: `{{ useBasicSignIn }}`,
            style: { width: '100%', height: '44px' },
          },
        },
      },
    },
    signup: {
      type: 'void',
      'x-component': 'Link',
      'x-component-props': {
        to: '{{ signupLink }}',
        style: {
          height: '50px',
          padding: '10px 19px',
          with: '100%',
          display: 'block',
          textAlign: 'center',
          marginTop: '20px',
        },
      },
      'x-content': '{{"Create an account test"}}',
      'x-visible': '{{ allowSignUp }}',
    },
    forgotPassword: {
      type: 'void',
      'x-component': 'Link',
      'x-component-props': {
        to: '{{ forgotPasswordLink }}',
        style: {
          with: '100%',
          display: 'block',
          textAlign: 'center',
          marginTop: '3px',
        },
      },
      'x-content': '{{"Forgot Password?"}}',
      'x-visible': '{{ allowSignUp }}',
    },
  },
};
const CustomSigninPage = () => {
  const { authType, name, options } = { authType: 'Email/Password', name: 'basic', options: {} };
  const signupPages = useContext(SignupPageContext);
  const allowSignUp = true;
  const signupLink = `/signup?authType=${authType}&name=${name}`;
  const forgotPasswordLink = `/forgotPassword`;

  const useBasicSignIn = () => {
    return useSignIn("something");
  };
  return (
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
                    scope={{ useBasicSignIn, allowSignUp, signupLink, forgotPasswordLink }}
                  />

                  {/* <div className="form-group">
                    <input type="text" className="form-control gray-placeholder" id="username" placeholder="Email*" />
                    <span className="icon-round-check input-state success"></span>
                    <span className="icon-round-cross input-state error"></span>
                    <span className="error-msg">Invalid Username!</span>
                  </div>
                  <div className="form-group">
                    <input
                      type="password"
                      className="form-control gray-placeholder"
                      id="password"
                      placeholder="Password*"
                    />
                    <span className="icon-round-check input-state success"></span>
                    <span className="icon-round-cross input-state error"></span>
                    <span className="error-msg">Wrong Password!</span>
                  </div>
                  <div className="forget-password-wrap">
                    <div className="form-check">
                      <div className="check-group">
                        <input type="checkbox" value="" id="rememberMe" />
                        <span className="form-check-input"></span>
                      </div>
                      <label className="form-check-label" htmlFor="rememberMe">
                        Remember me
                      </label>
                    </div>
                    <div>
                      <a href="forgot-password.html" className="links-btn">
                        Forgot password?
                      </a>
                    </div>
                  </div>
                  <div className="btn-controls">
                    <button className="btn btn-blue w-100">
                      Sign In <i className='icon-arrow-r'></i>
                    </button>
                  </div>
                  <div className="new-user-wrap">
                    New user?
                    <a href="forgot-password.html" className="links-btn">
                      Sign up for free
                    </a>
                  </div> */}
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
                  accelerating development and innovation while reducing time-to-market and avoiding technical barriers.
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
  );
};
export class TestSigninClient extends Plugin {
  async load() {
    this.app.addComponents({
      SigninPage: CustomSigninPage,
    });
  }
}

export default TestSigninClient;
