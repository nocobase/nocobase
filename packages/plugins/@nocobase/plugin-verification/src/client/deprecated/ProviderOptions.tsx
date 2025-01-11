/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FormLayout } from '@formily/antd-v5';
import { Field } from '@formily/core';
import { RecursionField, Schema, observer, useField, useForm } from '@formily/react';
import { useUpdateEffect } from 'ahooks';
import React, { useState } from 'react';
import providerTypes from './providerTypes';

const Verification = observer(
  (props) => {
    const form = useForm();
    const field = useField<Field>();
    const [s, setSchema] = useState(new Schema(providerTypes.get(form.values.type) || {}));
    useUpdateEffect(() => {
      form.clearFormGraph('options.*');
      setSchema(new Schema(providerTypes.get(form.values.type) || {}));
    }, [form.values.type]);
    return (
      <FormLayout layout={'vertical'}>
        <RecursionField
          key={form.values.type || 'sms-aliyun'}
          basePath={field.address}
          onlyRenderProperties
          schema={s}
        />
      </FormLayout>
    );
  },
  { displayName: 'Verification' },
);

export default Verification;
