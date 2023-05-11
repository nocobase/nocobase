import { useRequest, useRecord, useActionContext } from '@nocobase/client';
import { useEffect, useContext } from 'react';
import { useOptionsComponent } from '@nocobase/client';
import { AuthTypeContext } from './authType';

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
  const ctx = useContext(AuthTypeContext);
  const component = useOptionsComponent(ctx?.type);
  return component;
};
