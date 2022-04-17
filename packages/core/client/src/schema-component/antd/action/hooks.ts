import { useForm } from '@formily/react';
import { useContext } from 'react';
import { ActionContext } from './context';

export const useA = () => {
  return {
    async run() {},
  };
};

export const useActionContext = () => {
  const ctx = useContext(ActionContext);

  return {
    ...ctx,
    setVisible(visible: boolean) {
      if (ctx?.openMode !== 'page') {
        ctx?.setVisible?.(visible);
      }
    },
  };
};

export const useCloseAction = () => {
  const { setVisible } = useContext(ActionContext);
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
