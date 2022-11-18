import React from 'react';
import { FormLayout } from '@formily/antd';
import { Field } from '@formily/core';
import { observer, useField, useForm } from '@formily/react';
import { useEffect } from 'react';
import { Input, useRecord } from '@nocobase/client';

export const RedirectURLInput = observer(() => {
  const form = useForm();
  const field = useField<Field>();
  const record = useRecord();

  const clientId = form.values.clientId ?? record.clientId;

  useEffect(() => {
    const { protocol, host } = window.location;
    field.setValue(`${protocol}//${host}/signin?authenticator=oidc&clientId=${clientId}`);
  }, [clientId]);

  return (
    <div>
      <FormLayout layout={'vertical'}>
        <Input disabled value={field.value} />
      </FormLayout>
    </div>
  );
});
