import { useForm } from '@formily/react';
import { Plugin, SignupPage, useSignup } from '@nocobase/client';
import React from 'react';

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
      <div>Custom sign up page</div>
      <SignupPage {...props} scope={{ useSignup: useCustomSignup }} />
    </div>
  );
};

class CustomSignupPagePlugin extends Plugin {
  async load() {
    this.app.addComponents({
      SignupPage: CustomSignupPage,
    });
  }
}

export default CustomSignupPagePlugin;
