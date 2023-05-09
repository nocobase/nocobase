import { useRequest, useRecord, useActionContext } from '@nocobase/client';
import { useEffect } from 'react';
import { useForm } from '@formily/react';
import { useOptionsComponent } from '@nocobase/client';

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

export const Options = () => {
  const record = useRecord();
  const form = useForm();
  const component = useOptionsComponent(record.authType || form.values.authType);
  return component;
};
