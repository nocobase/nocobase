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
import React, { useMemo } from 'react';
import { connect, mapProps, mapReadPretty } from '@formily/react';
import { EditableFieldModel } from './EditableFieldModel';

const jsonCss = css`
  font-size: 80%;
  font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace;
`;
const JSONPrettyClassName = css`
  margin-bottom: 0;
  line-height: 1.5;
  font-size: 90%;
`;

const JsonInput = connect(
  Input.TextArea,
  mapProps((props: any, field: any) => {
    const { json5, className, value } = props || {};
    const _JSON = json5 ? JSON5 : JSON;
    const stringifiedValue = typeof value === 'string' ? value : value ? _JSON.stringify(value, null, 2) : '';
    return {
      ...props,
      value: stringifiedValue,
      autoSize: {
        maxRows: 10,
        minRows: 3,
      },
      className: cx(jsonCss, className),
      onChange: (ev) => {
        field.setValue(ev.target.value);
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
      },
    };
  }),
  mapReadPretty((props) => {
    const content = useMemo(
      () => (props.value != null ? JSON.stringify(props.value, null, props.space ?? 2) : ''),
      [props.space, props.value],
    );
    const JSONContent = (
      <pre className={cx(props.className, JSONPrettyClassName)} style={props.style}>
        {content}
      </pre>
    );
    return JSONContent;
  }),
);
export class JsonEditableFieldModel extends EditableFieldModel {
  static supportedFieldInterfaces = ['json'];

  get component() {
    return [JsonInput, {}];
  }
}
