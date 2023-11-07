import { SignupPage, SchemaComponent } from '@nocobase/client';
import React from 'react';

import LogoImg from '../assets/logo.svg';
import ArrowImg from '../assets/arrow-r.svg';
import CodenulaImg from '../assets/logo-codenula.png';
import RightImg from '../assets/image-login-right.png';
import { signupSchema } from '../schema';

import { useCustomSignup } from '../hooks';

import Loader from 'packages/plugins/@nocobase/smtp/src/client/utils/Loader';

const CustomSignupPage = (props) => {
  const [isLoading, setIsLoading] = React.useState(false);
  const signinLink = `/signin`;
  const allowSignUp = true;
  const useBasicSignUp = () => {
    return useCustomSignup({ isLoading, setIsLoading });
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
                  <div className="signupform">
                    {/* <SignupPage {...props} scope={{ useSignup: useCustomSignup }} /> */}

                    <SchemaComponent schema={signupSchema} scope={{ useBasicSignUp, allowSignUp, signinLink }} />

                  </div>
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

export default CustomSignupPage;
