import { useForm } from '@formily/react';
import { Plugin, css } from '@nocobase/client';
import { ResetPassword } from './pages/ResetPassword';
import { ISchema } from '@formily/react';
import { Authenticator, SchemaComponent, SignupPageContext, useSignIn, useAPIClient } from '@nocobase/client';
import React, { useContext } from 'react';
import './forgotPassword.css';
import './assets/icomoon/icomoon.css';
import LogoImg from './assets/logo.svg';
import ArrowImg from './assets/arrow-r.svg';
import CodenulaImg from './assets/logo-codenula.png';
import RightImg from './assets/image-login-right.png';
import { verifyOtp } from '../utils/schema';
import cloneDeep from 'lodash/cloneDeep';


const forgotPasswordForm: ISchema = {
  type: 'object',
  name: 'forgotPasswordForm',
  'x-component': 'FormV2',
  properties: {
    email: {
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
        placeholder: '{{"Enter your email"}}',
        style: { backgroundColor: '#e7f0fe', color: 'blue', height: '50px', padding: '10px 19px' },
      },
    },

    actions: {
      type: 'void',
      'x-component': 'div',
      properties: {
        submit: {
          title: '{{"Send Reset Link"}}',
          type: 'void',
          'x-component': 'Action',
          'x-component-props': {
            htmlType: 'submit',
            block: true,
            type: 'primary',
            useAction: `{{ useForgotPasswordEmailSubmit }}`,
            style: { width: '100%', height: '44px' },
          },
        },
      },
    },
  },
};



//sending otp to email
const useForgotPasswordEmailSubmit = () => {
  const form = useForm();

  const api = useAPIClient();

  return {
    async run() {
      await form.submit();
      const values = cloneDeep(form.values);

      console.log(values);

      await api
        .request({
          url: 'users:lostpassword',
          method: 'post',
          data: values,
        })
        .then((res) => {
          window.alert("Reset link sent successfully!")
         
          
          console.log(res);
        })
        .catch((err) => console.log(err));
    },
  };
};

export const CustomForgotPasswordPage = () => {
  const [isEmailVerified, setIsEmailVerified] = React.useState(false);
  const { authType, name, options } = { authType: 'Email/Password', name: 'basic', options: {} };
  const signupPages = useContext(SignupPageContext);
  const allowSignUp = true;
  const signupLink = `/signup?authType=${authType}&name=${name}`;
  const forgotPasswordLink = `/forgotPassword?authType=${authType}&name=${name}`;

  const useBasicSignIn = () => {
    return useSignIn(name);
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
                        schema={forgotPasswordForm}
                        scope={{ useBasicSignIn, allowSignUp, signupLink, forgotPasswordLink, useForgotPasswordEmailSubmit }}
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
        {/* <SchemaComponent schema={forgotPasswordForm} scope={{ useBasicSignIn, allowSignUp, signupLink }} /> */}
      </div>
   
  );
};
export class TestSigninClient extends Plugin {
  async load() {
    this.addRoutes();
    this.app.addComponents({
      CustomForgotPasswordPage,
      ResetPassword
    });

  }
  addRoutes() {
    this.app.router.add('forgotPassword', {
      path: '/forgotPassword',
      element: <CustomForgotPasswordPage />,
    });
    this.app.router.add('resetPassword', {
      path: '/resetPassword/:email/:token',
      element: <ResetPassword />,
    });
  }
}

export default TestSigninClient;
