import { FormLayout } from '@formily/antd-v5';
import { Field } from '@formily/core';
import { RecursionField, Schema, observer, useField, useForm } from '@formily/react';
import React, { useEffect, useState } from 'react';

import providerTypes from './providerTypes';

const Verification = observer(
  (props) => {
    const form = useForm();
    const field = useField<Field>();
    const [s, setSchema] = useState(new Schema({}));
    useEffect(() => {
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
