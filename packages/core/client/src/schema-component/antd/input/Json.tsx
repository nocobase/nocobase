import { Field } from '@formily/core';
import { useField } from '@formily/react';
import { Input } from 'antd';
import { TextAreaProps } from 'antd/es/input';
import React, { useState, useEffect, Ref } from 'react';
import { cx, css } from '@emotion/css';

export type JSONTextAreaProps = TextAreaProps & { value?: string; space?: number };

export const Json = React.forwardRef<typeof Input.TextArea, JSONTextAreaProps>(
  ({ value, onChange, space = 2, ...props }: JSONTextAreaProps, ref: Ref<any>) => {
    const field = useField<Field>();
    const [text, setText] = useState('');
    useEffect(() => {
      try {
        if (value != null) {
          setText(JSON.stringify(value, null, space));
        } else {
          setText(undefined);
        }
      } catch (ex) {
        //
      }
    }, [space, value]);
    return (
      <Input.TextArea
        {...props}
        className={cx(
          css`
            font-size: 80%;
            font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace;
          `,
          props.className,
        )}
        ref={ref}
        value={text}
        onChange={(ev) => {
          setText(ev.target.value);
          try {
            const v = ev.target.value.trim() !== '' ? JSON.parse(ev.target.value) : null;
            if (ev.target.value.trim() !== '') {
              JSON.parse(ev.target.value);
            }
            field.setFeedback({});
          } catch (err) {
            field.setFeedback({
              type: 'error',
              code: 'JSONSyntaxError',
              messages: [err.message],
            });
          }
        }}
        onBlur={(ev) => {
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
Json.displayName = 'Json';
