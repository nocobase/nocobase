import React, { useRef } from 'react';
import { Button } from 'antd';
import { css } from '@emotion/css';

import { Input } from '../input';
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

export function JSONInput(props) {
  const inputRef = useRef<any>(null);
  const { scope } = props;
  const options = typeof scope === 'function' ? scope() : scope ?? [];

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
      <Input.JSON {...props} ref={inputRef} />
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
        <VariableSelect options={options} onInsert={onInsert} />
      </Button.Group>
    </div>
  );
}
