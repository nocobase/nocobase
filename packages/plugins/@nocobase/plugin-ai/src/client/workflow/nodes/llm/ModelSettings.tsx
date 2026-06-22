/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observer, useForm } from '@formily/react';
import { useAPIClient, useRequest } from '@nocobase/client';
import React from 'react';
import { getLegacyWorkflowModelSettingsForm } from './legacy-provider-options';

export const useModelSettingsForm = (provider: string) => {
  return getLegacyWorkflowModelSettingsForm(provider);
};

export const Settings = observer(
  () => {
    const form = useForm();
    const api = useAPIClient();
    const { data, loading } = useRequest<{ provider: string }>(
      () =>
        api
          .resource('llmServices')
          .get({ filterByTk: form.values?.llmService })
          .then((res) => res?.data?.data),
      {
        ready: !!form.values?.llmService,
        refreshDeps: [form.values?.llmService],
      },
    );
    const Component = useModelSettingsForm(data?.provider);
    if (loading) {
      return null;
    }
    // v1 workflow still renders provider settings inside a Formily form.
    // Keep these v1 ModelSettingsForm components until workflow node configuration is migrated.
    return Component ? <Component /> : null;
  },
  { displayName: 'WorkflowLLMModelSettingsForm' },
);
