import { useForm } from '@formily/react';
import { useContext } from 'react';
import { VisibleContext } from './context';

export const useA = () => {
  return {
    async run() {},
  };
};

export const useCloseAction = () => {
  const [, setVisible] = useContext(VisibleContext);
  const form = useForm();
  return {
    async run() {
      setVisible(false);
      form.submit((values) => {
        console.log(values);
      });
    },
  };
};
