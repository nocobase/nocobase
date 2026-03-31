/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import { largeField, EditableItemModel, observer } from '@nocobase/flow-engine';
import { Input } from 'antd';
import { cx, css } from '@emotion/css';
import JSON5 from 'json5';
import React, { useState, useEffect, useRef } from 'react';
import { FieldModel } from '../base';

const jsonCss = css`
  font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace;
  font-size: 14px;
`;

export const JsonInput = observer((props: any) => {
  const { value, onChange, json5 = false, className, space = 2 } = props;
  const _JSON = json5 ? JSON5 : JSON;
  const internalChange = useRef(false);
  const [text, setText] = useState(
    typeof value === 'string' ? value : value ? _JSON.stringify(value, null, space) : '',
  );

  useEffect(() => {
    if (!internalChange.current) {
      if (value != null) {
        if (typeof value === 'string') {
          setText(value);
        } else {
          setText(_JSON.stringify(value, null, space));
        }
      } else {
        setText(undefined);
      }
    }

    internalChange.current = false;
  }, [value]);

  // 用户输入时
  const handleChange = (ev) => {
    const val = ev.target.value;
    setText(val); // 内部状态控制 TextArea，保持光标

    try {
      const parsed = val.trim() !== '' ? _JSON.parse(val) : null;
      onChange?.(parsed); // 外部接收对象或 null
      internalChange.current = true;
    } catch {
      internalChange.current = false;
      onChange?.(ev); // 解析失败传 null
    }
  };

  // 失焦时格式化 JSON
  const handleBlur = (ev) => {
    const val = ev.target.value;
    try {
      const parsed = _JSON.parse(text);
      setText(_JSON.stringify(parsed, null, space));
      onChange?.(parsed); // 外部接收对象或 null
    } catch {
      onChange?.(val.trim() !== '' ? val : null);
    }
  };

  return (
    <Input.TextArea
      value={text}
      onChange={handleChange}
      onBlur={handleBlur}
      autoSize={{ minRows: 4, maxRows: 10 }}
      className={cx(jsonCss, className)}
    />
  );
});

@largeField()
export class JsonFieldModel extends FieldModel {
  render() {
    return <JsonInput {...this.props} />;
  }
}

JsonFieldModel.registerFlow({
  key: 'jsonInitSetting',
  steps: {
    initValidation: {
      handler(ctx, params) {
        const rules = ctx.model.parent.props.rules || [];
        // 添加 JSON 语法校验规则
        rules.push({
          validator: (_, value) => {
            // 允许空
            if (value === null || value === undefined || value === '') return Promise.resolve();
            // 如果已经是对象/数组，直接通过
            if (typeof value === 'object') return Promise.resolve();
            try {
              JSON.parse(value);
              return Promise.resolve();
            } catch (err) {
              return Promise.reject(ctx.t('Invalid JSON format') + ': ' + err.message);
            }
          },
        });
        ctx.model.parent.setProps({
          rules,
        });
      },
    },
  },
});

EditableItemModel.bindModelToInterface('JsonFieldModel', ['json'], {
  isDefault: true,
});
