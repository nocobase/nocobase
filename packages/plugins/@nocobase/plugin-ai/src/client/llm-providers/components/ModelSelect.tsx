/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useState } from 'react';
import { useAPIClient, useActionContext, useRequest } from '@nocobase/client';
import { useForm, useField } from '@formily/react';
import { AutoComplete, Spin } from 'antd';
import { Field } from '@formily/core';

export const ModelSelect: React.FC = () => {
  const field = useField<Field>();
  const serviceField = field.query('.llmService').take() as Field;
  const api = useAPIClient();
  const ctx = useActionContext();
  const [options, setOptions] = useState([]);
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
          llmService: serviceField?.value,
        })
        .then(
          (res) =>
            res?.data?.data?.map(
              ({ id }) =>
                ({
                  label: id,
                  value: id,
                }) || [],
            ),
        ),
    {
      ready: !!serviceField?.value && ctx.visible,
      refreshDeps: [serviceField?.value],
      onSuccess: (data) => setOptions(data),
    },
  );

  const handleSearch = (value: string) => {
    if (!models) {
      setOptions([]);
      return;
    }
    if (!value) {
      setOptions(models);
      return;
    }
    const searchOptions = models.filter((option) => {
      return option.label.toLowerCase().includes(value.toLowerCase());
    });
    setOptions(searchOptions);
  };

  return (
    <AutoComplete
      onSearch={handleSearch}
      options={options}
      notFoundContent={loading ? <Spin size="small" /> : null}
      value={field.value}
      onChange={(val) => (field.value = val)}
    />
  );
};
