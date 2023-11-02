import { useForm } from '@formily/react';
import { Plugin, SignupPage, useSignup } from '@nocobase/client';
import React from 'react';
import './signup.css';
import LogoImg from './assets/logo.svg';
import ArrowImg from './assets/arrow-r.svg';
import CodenulaImg from './assets/logo-codenula.png';
import RightImg from './assets/image-login-right.png';

const useCustomSignup = () => {
  const { run } = useSignup();
  const form = useForm();
  return {
    async run() {
      console.log('useCustomSignup');
      form.setValuesIn('url', 'bb');
      await run();
    },
  };
};

const CustomSignupPage = (props) => {
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
                  <div className="signupform">
                    <SignupPage {...props} scope={{ useSignup: useCustomSignup }} />
                  </div>

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
    </div>

    // <div>
    //   <div>Custom sign up page</div>
    //   <SignupPage {...props} scope={{ useSignup: useCustomSignup }} />
    // </div>
  );
};

export class TestSignupClient extends Plugin {
  async afterAdd() {
    // await this.app.pm.add()
  }

  async beforeLoad() {}

  // You can get and modify the app instance here
  async load() {
    this.app.addComponents({
      SignupPage: CustomSignupPage,
    });
    // this.app.addComponents({})
    // this.app.addScopes({})
    // this.app.addProvider()
    // this.app.addProviders()
    // this.app.router.add()
  }
}

export default TestSignupClient;
