/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css } from '@emotion/css';
import { FlowContextSelector, useFlowContext } from '@nocobase/flow-engine';
import { Input } from '@nocobase/client';
import { Button } from 'antd';
import type { TextAreaProps } from 'antd/es/input';
import React, { useCallback, useMemo, useRef } from 'react';

export type FlowJsonWithContextSelectorProps = TextAreaProps & {
  value?: any;
  onChange?: (value: any) => void;
};

function setNativeInputValue(input: HTMLTextAreaElement, value: string) {
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(input.constructor.prototype, 'value')?.set;
  nativeInputValueSetter?.call(input, value);
  input.dispatchEvent(
    new Event('input', {
      bubbles: true,
    }),
  );
}

export const FlowJsonWithContextSelector: React.FC<FlowJsonWithContextSelectorProps> = ({
  value,
  onChange,
  ...props
}) => {
  const flowCtx = useFlowContext();
  const inputRef = useRef<any>(null);

  const insertAtCaret = useCallback((toInsert: string) => {
    const textArea = inputRef.current?.resizableTextArea?.textArea as HTMLTextAreaElement | undefined;
    if (!textArea) {
      return;
    }

    const currentValue = textArea.value || '';
    const start = textArea.selectionStart ?? currentValue.length;
    const end = textArea.selectionEnd ?? start;
    const nextValue = currentValue.slice(0, start) + toInsert + currentValue.slice(end);

    setNativeInputValue(textArea, nextValue);

    requestAnimationFrame(() => {
      const pos = start + toInsert.length;
      textArea.setSelectionRange(pos, pos);
      textArea.focus();
    });
  }, []);

  const handleVariableSelected = useCallback(
    (varValue: string) => {
      if (!varValue) {
        return;
      }
      insertAtCaret(varValue);
    },
    [insertAtCaret],
  );

  const metaTree = useMemo(() => () => flowCtx.getPropertyMetaTree?.(), [flowCtx]);

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <Input.JSON ref={inputRef} value={value} onChange={onChange} {...props} />
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          zIndex: 1,
          lineHeight: 0,
        }}
      >
        <FlowContextSelector metaTree={metaTree} onChange={(val) => handleVariableSelected(val)}>
          <Button
            type="default"
            style={{ fontStyle: 'italic', fontFamily: 'New York, Times New Roman, Times, serif' }}
            className={css`
              &:not(:hover) {
                border-right-color: transparent;
                border-top-color: transparent;
                background-color: transparent;
              }
            `}
          >
            x
          </Button>
        </FlowContextSelector>
      </div>
    </div>
  );
};

export default FlowJsonWithContextSelector;
