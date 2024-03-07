import React from 'react';
import { observer, useForm } from '@formily/react';
import { useActionContext, usePlugin, useRecord, useRequest } from '@nocobase/client';
import { useEffect } from 'react';
import AuthPlugin from '..';

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

export const useAdminSettingsForm = (authType: string) => {
  const plugin = usePlugin(AuthPlugin);
  const auth = plugin.authTypes.get(authType);
  return auth?.components?.AdminSettingsForm;
};

export const Options = observer(
  () => {
    const form = useForm();
    const record = useRecord();
    const Component = useAdminSettingsForm(form.values.authType || record.authType);
    return Component ? <Component /> : null;
  },
  { displayName: 'Options' },
);
