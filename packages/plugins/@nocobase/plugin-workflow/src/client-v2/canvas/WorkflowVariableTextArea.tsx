/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css, cx } from '@emotion/css';
import { Button, Input } from 'antd';
import type { TextAreaProps } from 'antd/es/input';
import type { TextAreaRef } from 'antd/es/input/TextArea';
import { FlowContextSelector } from '@nocobase/flow-engine';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { insertTextAtSelection } from './textAreaInsertion';
import { formatWorkflowPathToValue } from './workflowVariableConverters';
import { useWorkflowVariableOptions, type UseWorkflowVariableOptions } from './useWorkflowVariableOptions';

export interface WorkflowVariableTextAreaProps extends Omit<TextAreaProps, 'value' | 'onChange'> {
  value?: string;
  onChange?: (value: string) => void;
  variableOptions?: UseWorkflowVariableOptions;
  delimiters?: readonly [string, string];
}

const selectorButtonClassName = css`
  &:not(:hover) {
    border-right-color: transparent;
    border-top-color: transparent;
    background-color: transparent;
  }
`;

const codeTextAreaClassName = css`
  font-size: 80%;
  font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace;
`;

export function WorkflowVariableTextArea(props: WorkflowVariableTextAreaProps) {
  const { value = '', onChange, variableOptions, className, style, delimiters = ['{{', '}}'], ...rest } = props;
  const [innerValue, setInnerValue] = useState(value);
  const inputRef = useRef<TextAreaRef>(null);
  const metaTree = useWorkflowVariableOptions(variableOptions);
  const metaTreeGetter = useMemo(() => () => metaTree, [metaTree]);

  useEffect(() => {
    setInnerValue(value);
  }, [value]);

  const handleTextChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      const nextValue = event.target.value;
      setInnerValue(nextValue);
      onChange?.(nextValue);
    },
    [onChange],
  );

  const handleVariableSelected = useCallback(
    (selectedValue: string) => {
      if (!selectedValue) {
        return;
      }

      const input = inputRef.current?.resizableTextArea?.textArea;
      if (!input) {
        const nextValue = `${innerValue}${selectedValue}`;
        setInnerValue(nextValue);
        onChange?.(nextValue);
        return;
      }

      const { nextValue, nextSelectionStart, nextSelectionEnd } = insertTextAtSelection(
        innerValue,
        selectedValue,
        input.selectionStart ?? innerValue.length,
        input.selectionEnd ?? input.selectionStart ?? innerValue.length,
      );
      setInnerValue(nextValue);
      onChange?.(nextValue);

      requestAnimationFrame(() => {
        input.setSelectionRange(nextSelectionStart, nextSelectionEnd);
        input.focus();
      });
    },
    [innerValue, onChange],
  );

  return (
    <div style={{ position: 'relative', width: '100%', ...style }}>
      <Input.TextArea
        {...rest}
        ref={inputRef}
        value={innerValue}
        onChange={handleTextChange}
        className={cx(codeTextAreaClassName, className)}
      />
      <div style={{ position: 'absolute', insetInlineEnd: 0, insetBlockStart: 0, lineHeight: 0 }}>
        <FlowContextSelector
          metaTree={metaTreeGetter}
          disabled={rest.disabled}
          formatPathToValue={(item) => {
            const raw = formatWorkflowPathToValue(item);
            if (!raw) {
              return '';
            }
            return raw.replace('{{', delimiters[0]).replace('}}', delimiters[1]);
          }}
          onChange={handleVariableSelected}
        >
          <Button
            type="default"
            style={{ fontStyle: 'italic', fontFamily: 'New York, Times New Roman, Times, serif' }}
            className={selectorButtonClassName}
          >
            x
          </Button>
        </FlowContextSelector>
      </div>
    </div>
  );
}

export default WorkflowVariableTextArea;
