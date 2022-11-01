import React, { useState } from 'react';
import { Field } from '@formily/core';
import { useField } from '@formily/react';
import { Input } from 'antd';
import { TextAreaProps } from 'antd/lib/input';

export function Json({ value, onChange, space = 2, ...props }: TextAreaProps & { value: any, space: number }) {
  const field = useField<Field>();
  return (
    <Input.TextArea
      {...props}
      defaultValue={value != null ? JSON.stringify(value, null, space) : ''}
      onChange={(ev) => {
        try {
          const v = ev.target.value.trim() !== '' ? JSON.parse(ev.target.value) : null;
          field.setFeedback({});
          onChange(v);
        } catch (err) {
          field.setFeedback({
            type: 'error',
            code: 'JSONSyntaxError',
            messages: [err.message],
          });
        }
      }}
    />
  );
}
