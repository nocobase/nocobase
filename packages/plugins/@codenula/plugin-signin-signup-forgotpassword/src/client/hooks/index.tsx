import { useSignup, useAPIClient } from '@nocobase/client';
import cloneDeep from 'lodash/cloneDeep';
import { useForm } from '@formily/react';
import message from 'antd';

export const useForgotPasswordEmailSubmit = () => {
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
          window.alert('Reset link sent successfully!');

          console.log(res);
        })
        .catch((err) => console.log(err));
    },
  };
};

export const useCustomSignup = ({isLoading,setIsLoading}) => {

  const { run } = useSignup();
  const form = useForm();
  const api = useAPIClient();
  return {
    async run() {
      console.log('useCustomSignup');
      form.setValuesIn('url', 'bb');
      setIsLoading(true)
      await run();
      setIsLoading(false)
    },
  };
};
