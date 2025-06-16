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
import { FormFieldModel } from '../../FormFieldModel';

const jsonCss = css`
  font-size: 80%;
  font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace;
`;

export class JsonFieldModel extends FormFieldModel {
  get component() {
    const { json5, className } = this.props;
    const _JSON = json5 ? JSON5 : JSON;

    return [
      Input.TextArea,
      {
        autoSize: {
          maxRows: 10,
          minRows: 3,
        },
        ...this.props,
        className: cx(jsonCss, className),
        onChange: (ev) => {
          this.field.setValue(ev.target.value);
          try {
            const v = ev.target.value.trim() !== '' ? _JSON.parse(ev.target.value) : null;
            if (ev.target.value.trim() !== '') {
              _JSON.parse(ev.target.value);
            }
            this.field.setFeedback({});
          } catch (err) {
            this.field.setFeedback({
              type: 'error',
              code: 'JSONSyntaxError',
              messages: [err.message],
            });
          }
        },
      },
    ];
  }
}
