/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css } from '@emotion/css';
import { Button, Input } from 'antd';
import React, { useRef, useState } from 'react';
import { VariableSelect } from './VariableSelect';

// NOTE: https://stackoverflow.com/questions/23892547/what-is-the-best-way-to-trigger-onchange-event-in-react-js/46012210#46012210
function setNativeInputValue(input, value) {
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(input.constructor.prototype, 'value')?.set;
  nativeInputValueSetter?.call(input, value);
  input.dispatchEvent(
    new Event('input', {
      bubbles: true,
    }),
  );
}

export function RawTextArea(props): JSX.Element {
  const inputRef = useRef<any>(null);
  const { changeOnSelect, component: Component = Input.TextArea, fieldNames, scope, buttonClass, ...others } = props;
  const dataScope = typeof scope === 'function' ? scope() : scope;
  const [options, setOptions] = useState(dataScope ? dataScope : []);

  function onInsert(selected) {
    if (!inputRef.current) {
      return;
    }

    const variable = `{{${selected.join('.')}}}`;

    const { textArea } = inputRef.current.resizableTextArea;
    const nextValue =
      textArea.value.slice(0, textArea.selectionStart) + variable + textArea.value.slice(textArea.selectionEnd);
    const nextPos = [textArea.selectionStart, textArea.selectionStart + variable.length];
    setNativeInputValue(textArea, nextValue);
    textArea.setSelectionRange(...nextPos);
    textArea.focus();
  }
  return (
    <div
      className={css`
        position: relative;
        .ant-input {
          width: 100%;
        }
      `}
    >
      <Component {...others} ref={inputRef} />
      <Button.Group
        className={css`
          position: absolute;
          right: 0;
          top: 0;
          .ant-btn-sm {
            font-size: 85%;
          }
        `}
      >
        <VariableSelect
          className={
            buttonClass ??
            css`
              &:not(:hover) {
                border-right-color: transparent;
                border-top-color: transparent;
              }
              background-color: transparent;
            `
          }
          fieldNames={fieldNames}
          options={options}
          setOptions={setOptions}
          onInsert={onInsert}
          changeOnSelect={changeOnSelect}
          disabled={others.disabled}
        />
      </Button.Group>
    </div>
  );
}
