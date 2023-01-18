import React, { Ref } from 'react';
import { Field } from '@formily/core';
import { useField } from '@formily/react';
import { Input } from 'antd';
import { TextAreaProps } from 'antd/lib/input';

export type JSONTextAreaProps = TextAreaProps & { ref: Ref<any>, value: any, space: number };

export const Json = React.forwardRef<Ref<any>>(({ value, onChange, space = 2, ...props }: JSONTextAreaProps, ref: Ref<any>) => {
  const field = useField<Field>();
  return (
    <Input.TextArea
      {...props}
      ref={ref}
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
});
