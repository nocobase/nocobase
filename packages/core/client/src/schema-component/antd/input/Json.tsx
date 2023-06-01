import React, { Ref } from 'react';
import { Field } from '@formily/core';
import { useField } from '@formily/react';
import { Input } from 'antd';
import { TextAreaProps } from 'antd/lib/input';

export type JSONTextAreaProps = TextAreaProps & { value?: string; space?: number };

export const Json = React.forwardRef<typeof Input.TextArea, JSONTextAreaProps>(
  ({ value, onChange, space = 2, ...props }: JSONTextAreaProps, ref: Ref<any>) => {
    const field = useField<Field>();
    return (
      <Input.TextArea
        {...props}
        ref={ref}
        value={value != null ? JSON.stringify(value, null, space) : ''}
        onChange={(ev) => {
          try {
            const v = ev.target.value.trim() !== '' ? JSON.parse(ev.target.value) : null;
            field.setFeedback({});
            onChange?.(v);
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
  },
);
