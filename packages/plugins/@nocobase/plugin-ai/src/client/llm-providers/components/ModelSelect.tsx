/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { useAPIClient, useActionContext, useRequest } from '@nocobase/client';
import { useForm, useField } from '@formily/react';
import { AutoComplete, Spin } from 'antd';
import { Field } from '@formily/core';

export const ModelSelect: React.FC = () => {
  const field = useField<Field>();
  const form = useForm();
  const api = useAPIClient();
  const ctx = useActionContext();
  const { data: models, loading } = useRequest<
    {
      label: string;
      value: string;
    }[]
  >(
    () =>
      api
        .resource('ai')
        .listModels({
          llmService: form.values?.llmService,
        })
        .then(
          (res) =>
            res?.data?.data?.map(({ id }) => ({
              label: id,
              value: id,
            })),
        ),
    {
      ready: !!form.values?.llmService && ctx.visible,
      refreshDeps: [form.values?.llmService],
    },
  );

  return (
    <AutoComplete
      showSearch={true}
      options={models}
      notFoundContent={loading ? <Spin size="small" /> : null}
      value={field.value}
      onChange={(val) => (field.value = val)}
    />
  );
};
