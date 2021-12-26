import { useForm } from '@formily/react';
import { useContext } from 'react';
import { VisibleContext } from './context';

export const useA = () => {
  return {
    async run() {},
  };
};

export const useActionVisible = () => {
  const [visible, setVisible] = useContext(VisibleContext);
  return { visible, setVisible };
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
