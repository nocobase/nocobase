/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useState } from 'react';
import { useForm, useField } from '@formily/react';
import { Select } from 'antd';
import { Field, LifeCycleTypes } from '@formily/core';
import { normalizeEnabledModels } from './EnabledModelsSelect';

export const DefaultModelSelect: React.FC<any> = (props) => {
  const [options, setOptions] = useState<{ label: string; value: string }[]>([]);
  const field = useField<Field>();
  const form = useForm();

  const updateOptions = (enabledModels: unknown) => {
    const config = normalizeEnabledModels(enabledModels);
    if (config.mode === 'recommended') {
      setOptions([]);
      return;
    }
    setOptions(config.models.filter((m) => m.value));
  };

  useEffect(() => {
    const { enabledModels } = form.values;
    updateOptions(enabledModels);

    const unsubscribe = form.subscribe((event) => {
      if (event.type === LifeCycleTypes.ON_FORM_VALUES_CHANGE) {
        const { enabledModels: newEnabledModels } = event.payload.values || {};
        updateOptions(newEnabledModels);
      }
    });
    return () => form.unsubscribe(unsubscribe);
  }, [form]);

  return (
    <Select
      {...props}
      options={options}
      value={field.value}
      onChange={(val) => (field.value = val)}
      placeholder="Select default model"
      allowClear
    />
  );
};
