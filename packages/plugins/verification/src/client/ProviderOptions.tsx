import React, { useEffect, useState } from 'react';
import { FormLayout } from '@formily/antd';
import { Field } from '@formily/core';
import { observer, RecursionField, Schema, useField, useForm } from '@formily/react';

import providerTypes from './providerTypes';

export default observer((props) => {
  const form = useForm();
  const field = useField<Field>();
  const [s, setSchema] = useState(new Schema({}));
  useEffect(() => {
    form.clearFormGraph('options.*');
    setSchema(new Schema(providerTypes.get(form.values.type) || {}));
  }, [form.values.type]);
  return (
    <FormLayout layout={'vertical'}>
      <RecursionField key={form.values.type || 'sms-aliyun'} basePath={field.address} onlyRenderProperties schema={s} />
    </FormLayout>
  );
});
