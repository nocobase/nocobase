import React, { useState, useRef } from 'react';
import { Popover, Button } from 'antd';
import { css } from "@emotion/css";

import { Input } from "@nocobase/client";

import { Operand, VariableTypes, VariableTypesContext } from '../variable';
import { lang } from '../locale';



// NOTE: https://stackoverflow.com/questions/23892547/what-is-the-best-way-to-trigger-onchange-event-in-react-js/46012210#46012210
function setNativeInputValue(input, value) {
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(input.constructor.prototype, 'value').set;
  nativeInputValueSetter.call(input, value);
  input.dispatchEvent(new Event('input', {
    bubbles: true,
  }));
}

export function VariableJSONInput(props) {
  const [variable, setVariable] = useState<string>('');
  const inputRef = useRef(null);
  const { value, space = 2 } = props;

  function onFormat() {
    if (!inputRef.current) {
      return;
    }
    if (!value) {
      return;
    }

    const { textArea } = inputRef.current.resizableTextArea;
    const nextValue = JSON.stringify(value, null, space);
    setNativeInputValue(textArea, nextValue);
    textArea.setSelectionRange(nextValue.length, nextValue.length);
    textArea.focus();
  }

  function onInsert() {
    if (!inputRef.current) {
      return;
    }
    if (!variable) {
      return;
    }

    const { textArea } = inputRef.current.resizableTextArea;
    const nextValue = textArea.value.slice(0, textArea.selectionStart) + `"${variable}"` + textArea.value.slice(textArea.selectionEnd);
    const nextPos = [textArea.selectionStart, textArea.selectionStart + variable.length + 2];
    setNativeInputValue(textArea, nextValue);
    textArea.setSelectionRange(...nextPos);
    textArea.focus();
  }
  return (
    <div className={css`
      position: relative;
      .ant-input{
        width: 100%;
      }
    `}>
      <Input.JSON {...props} ref={inputRef} />
      <Button.Group
        className={css`
          position: absolute;
          right: 2px;
          top: 2px;
          .ant-btn-sm{
            font-size: 85%;
          }
        `}
      >
        <Button size="small" onClick={onFormat}>{lang('Format')}</Button>
        <Popover
          trigger="click"
          placement="topRight"
          content={
            <div className={css`
              display: flex;
              gap: .5em;
            `}>
              <VariableTypesContext.Provider value={{
                $jobsMapByNodeId: VariableTypes.$jobsMapByNodeId,
                $context: VariableTypes.$context,
              }}>
                <Operand value={variable} onChange={setVariable} />
                <Button onClick={onInsert} disabled={!variable}>{lang('Insert')}</Button>
              </VariableTypesContext.Provider>
            </div>
          }
        >
          <Button size="small">{lang('Use variables')}</Button>
        </Popover>
      </Button.Group>
    </div>
  );
}
