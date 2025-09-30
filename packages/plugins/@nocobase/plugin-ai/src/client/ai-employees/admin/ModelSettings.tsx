/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observer, useForm } from '@formily/react';
import { SchemaComponent, useAPIClient, usePlugin, useRequest } from '@nocobase/client';
import React from 'react';
import PluginAIClient from '../..';
import { useT } from '../../locale';

const useModelOptionsForm = (provider: string) => {
  const plugin = usePlugin(PluginAIClient);
  const p = plugin.aiManager.llmProviders.get(provider);
  return p?.components?.ModelSettingsForm;
};

const ModelOptions = observer(
  () => {
    const form = useForm();
    const api = useAPIClient();
    const { data, loading } = useRequest<{ provider: string }>(
      () =>
        api
          .resource('llmServices')
          .get({ filterByTk: form.values?.modelSettings?.llmService })
          .then((res) => res?.data?.data),
      {
        ready: !!form.values?.modelSettings?.llmService,
        refreshDeps: [form.values?.modelSettings?.llmService],
      },
    );
    const Component = useModelOptionsForm(data?.provider);
    if (loading) {
      return null;
    }
    return Component ? <Component /> : null;
  },
  { displayName: 'AIEmployeeModelOptionsForm' },
);

export const ModelSettings: React.FC = () => {
  const t = useT();
  return (
    <SchemaComponent
      scope={{ t }}
      components={{ ModelOptions }}
      schema={{
        type: 'object',
        name: 'modelSettings',
        properties: {
          llmService: {
            type: 'string',
            title: '{{t("LLM service")}}',
            required: true,
            'x-decorator': 'FormItem',
            'x-component': 'RemoteSelect',
            'x-component-props': {
              manual: false,
              fieldNames: {
                label: 'title',
                value: 'name',
              },
              service: {
                resource: 'llmServices',
                action: 'list',
                params: {
                  fields: ['title', 'name'],
                },
              },
            },
          },
          settings: {
            type: 'void',
            'x-component': 'ModelOptions',
          },
        },
      }}
    />
  );
};
