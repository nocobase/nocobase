/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css, cx } from '@emotion/css';
import { Input } from 'antd';
import JSON5 from 'json5';
import React from 'react';

const jsonCss = css`
  font-size: 80%;
  font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace;
`;

export const JsonInput = (props) => {
  const { json5, className, value, onChange, form } = props || {};
  const _JSON = json5 ? JSON5 : JSON;
  const stringifiedValue = typeof value === 'string' ? value : value ? _JSON.stringify(value, null, 2) : '';
  const componentProps = {
    ...props,
    value: stringifiedValue,
    autoSize: {
      maxRows: 10,
      minRows: 3,
    },
    className: cx(jsonCss, className),
    onChange: (ev: any) => {
      const val = ev.target.value;
      onChange(val);
      try {
        const v = val.trim() !== '' ? _JSON.parse(val) : null;
        if (val.trim() !== '') {
          _JSON.parse(val);
        }
        form.setFields([
          {
            name: props.id,
            errors: [],
          },
        ]);
      } catch (err) {
        console.log(props);

        form.setFields([
          {
            name: props.id,
            errors: [err.message],
          },
        ]);
      }
    },
  };
  return <Input.TextArea {...componentProps} />;
};
