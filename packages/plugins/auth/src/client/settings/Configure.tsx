import {
  useRequest,
  useRecord,
  useActionContext,
  useResourceActionContext,
  useResourceContext,
  useHasOptionsComponent,
} from '@nocobase/client';
import { useEffect } from 'react';
import { useForm } from '@formily/react';
import { useOptionsComponent } from '@nocobase/client';

export const useUpdateOptionsAction = () => {
  const { setVisible } = useActionContext();
  const form = useForm();
  const { refresh } = useResourceActionContext();
  const { resource, targetKey } = useResourceContext();
  const { [targetKey]: filterByTk } = useRecord();
  return {
    async run() {
      await form.submit();
      await resource.update({
        filterByTk,
        values: {
          options: form.values,
        },
      });
      setVisible(false);
      await form.reset();
      refresh();
    },
  };
};

export const useCanConfigure = () => {
  const record = useRecord();
  const can = useHasOptionsComponent(record.authType);
  console.log(can);
  return can;
};

export const useValuesFromOptions = (options) => {
  const record = useRecord();
  const result = useRequest(
    () =>
      Promise.resolve({
        data: {
          ...record.options,
        },
      }),
    {
      ...options,
      manual: true,
    },
  );
  const { run } = result;
  const ctx = useActionContext();
  useEffect(() => {
    if (ctx.visible) {
      run();
    }
  }, [ctx.visible, run]);
  return result;
};

export const Configure = () => {
  const record = useRecord();
  const component = useOptionsComponent(record.authType);
  return component;
};
