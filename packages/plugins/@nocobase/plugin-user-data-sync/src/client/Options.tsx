/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { observer, useForm } from '@formily/react';
import { useActionContext, useCollectionRecordData, usePlugin, useRequest } from '@nocobase/client';
import { useEffect } from 'react';
import SourcePlugin from '.';

export const useValuesFromOptions = (options) => {
  const record = useCollectionRecordData();
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

export const useAdminSettingsForm = (sourceType: string) => {
  const plugin = usePlugin(SourcePlugin);
  const source = plugin.sourceTypes.get(sourceType);
  return source?.components?.AdminSettingsForm;
};

export const Options = observer(
  () => {
    const form = useForm();
    const record = useCollectionRecordData();
    const Component = useAdminSettingsForm(form.values.sourceType || record.sourceType);
    return Component ? <Component /> : null;
  },
  { displayName: 'Options' },
);
