import { observer, useForm } from '@formily/react';
import { useActionContext, useOptionsComponent, useRecord, useRequest } from '@nocobase/client';
import { useEffect } from 'react';

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

export const Options = observer(() => {
  const form = useForm();
  const record = useRecord();
  const component = useOptionsComponent(form.values.authType || record.authType);
  return component;
});
