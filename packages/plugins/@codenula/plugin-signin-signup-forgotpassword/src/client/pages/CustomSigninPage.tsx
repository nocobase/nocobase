import {
  Authenticator,
  SchemaComponent,
  SignupPageContext,
  useSignIn,
  SignupPage,
  useSignup,
  useAPIClient,
} from '@nocobase/client';
import React, { useContext } from 'react';
import LogoImg from '../assets/logo.svg';
import CodenulaImg from '../assets/logo-codenula.png';
import RightImg from '../assets/image-login-right.png';
import { passwordForm } from '../schema';
import '../../../../plugin-smtp/src/client/utils/Loader.css';

const CustomSigninPage = () => {
  const [isLoading, setIsLoading] = React.useState(false);
  const { authType, name, options } = { authType: 'Email/Password', name: 'basic', options: {} };
  const signupPages = useContext(SignupPageContext);
  const allowSignUp = true;
  const signupLink = `/signup?authType=${authType}&name=${name}`;
  const forgotPasswordLink = `/forgotPassword`;

  const useBasicSignIn = () => {
    return useSignIn('something');
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

export default CustomSigninPage;
