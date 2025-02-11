/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css, cx } from '@emotion/css';
import { Field } from '@formily/core';
import { useField } from '@formily/react';
import { Input } from 'antd';
import { TextAreaProps } from 'antd/es/input';
import JSON5 from 'json5';
import React, { Ref, useEffect, useState } from 'react';

export type JSONTextAreaProps = TextAreaProps & { value?: string; space?: number; json5?: boolean };

const jsonCss = css`
  font-size: 80%;
  font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace;
`;

export const Json = React.forwardRef<typeof Input.TextArea, JSONTextAreaProps>(
  ({ value, onChange, space = 2, json5 = false, ...props }: JSONTextAreaProps, ref: Ref<any>) => {
    const _JSON = json5 ? JSON5 : JSON;
    const field = useField<Field>();
    const [text, setText] = useState('');
    useEffect(() => {
      try {
        if (value != null) {
          if (typeof value === 'string') {
            try {
              _JSON.parse(value);
              setText(value);
            } catch (error) {
              setText(_JSON.stringify(value, null, space));
            }
          } else {
            setText(_JSON.stringify(value, null, space));
          }
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
        className={cx(jsonCss, props.className)}
        ref={ref}
        value={text}
        onChange={(ev) => {
          setText(ev.target.value);
          try {
            const v = ev.target.value.trim() !== '' ? _JSON.parse(ev.target.value) : null;
            if (ev.target.value.trim() !== '') {
              _JSON.parse(ev.target.value);
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
            const v = ev.target.value.trim() !== '' ? _JSON.parse(ev.target.value) : null;
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
