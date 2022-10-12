import { useForm } from '@formily/react';
import { RouteSwitchContext, SignupPage, useSignup } from '@nocobase/client';
import React, { useContext } from 'react';

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

export default React.memo((props) => {
  const ctx = useContext(RouteSwitchContext);
  return (
    <RouteSwitchContext.Provider value={{ ...ctx, components: { ...ctx.components, SignupPage: CustomSignupPage } }}>
      {props.children}
    </RouteSwitchContext.Provider>
  );
});
