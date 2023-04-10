import React, { useRef, useState } from 'react';
import { Button, Cascader, Popover, Input as AntInput } from 'antd';
import { css } from "@emotion/css";

import { Input } from "../input";
import { useTranslation } from 'react-i18next';
import { XButton } from './XButton';



// NOTE: https://stackoverflow.com/questions/23892547/what-is-the-best-way-to-trigger-onchange-event-in-react-js/46012210#46012210
function setNativeInputValue(input, value) {
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(input.constructor.prototype, 'value')?.set;
  nativeInputValueSetter?.call(input, value);
  input.dispatchEvent(new Event('input', {
    bubbles: true,
  }));
}

export function JSONInput(props) {
  const inputRef = useRef<any>(null);
  const { value, space = 2, scope } = props;
  const { t } = useTranslation();
  const [selectedVar, setSelectedVar] = useState<string[]>([]);
  const options = typeof scope === 'function' ? scope() : (scope ?? []);

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

  function onInsert(selected) {
    if (!inputRef.current) {
      return;
    }

    const variable = `{{${selected.join('.')}}}`;

    const { textArea } = inputRef.current.resizableTextArea;
    const nextValue = textArea.value.slice(0, textArea.selectionStart) + variable + textArea.value.slice(textArea.selectionEnd);
    const nextPos = [textArea.selectionStart, textArea.selectionStart + variable.length];
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
          right: 0;
          top: 0;
          .ant-btn-sm{
            font-size: 85%;
          }
        `}
      >
        <Button onClick={onFormat}>{t('Prettify')}</Button>
        <Popover
          content={(
            <AntInput.Group compact>
              <Cascader
                placeholder={t('Select a variable')}
                value={selectedVar}
                options={options}
                onChange={(keyPaths) => setSelectedVar(keyPaths as string[])}
                changeOnSelect
              />
              <Button onClick={onInsert}>{t('Insert')}</Button>
            </AntInput.Group>
          )}
          trigger="click"
          placement="topRight"
        >
          <XButton />
        </Popover>
      </Button.Group>
    </div>
  );
}
