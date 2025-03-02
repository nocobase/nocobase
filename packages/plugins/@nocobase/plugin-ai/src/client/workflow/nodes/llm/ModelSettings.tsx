/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observer, useForm } from '@formily/react';
import { useAPIClient, usePlugin, useRequest } from '@nocobase/client';
import React from 'react';
import PluginAIClient from '../../../';

export const useModelSettingsForm = (provider: string) => {
  const plugin = usePlugin(PluginAIClient);
  const p = plugin.aiManager.llmProviders.get(provider);
  return p?.components?.ModelSettingsForm;
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
    return Component ? <Component /> : null;
  },
  { displayName: 'WorkflowLLMModelSettingsForm' },
);
