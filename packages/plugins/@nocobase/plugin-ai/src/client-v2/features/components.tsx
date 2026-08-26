/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFlowContext } from '@nocobase/flow-engine';
import { EnvVariableInput } from '@nocobase/client-v2';
import { Form, type FormInstance } from 'antd';
import React from 'react';
import type { VectorStorePropField, VectorStorePropFormValues } from './vector-store-provider';

export const defaultVectorStorePropForm = (fields: VectorStorePropField[]) => {
  return ({ form }: { form: FormInstance<VectorStorePropFormValues> }) => {
    const ctx = useFlowContext();

    return (
      <Form form={form} layout="vertical" validateMessages={{ required: ctx.t('defaults.form.required') }}>
        {fields.map(({ label, key, tooltip, required, password }, index) => (
          <Form.Item
            key={index}
            label={label ?? key}
            name={key}
            tooltip={tooltip}
            required={required}
            rules={required ? [{ required: true }] : undefined}
          >
            <EnvVariableInput password={password} />
          </Form.Item>
        ))}
      </Form>
    );
  };
};
