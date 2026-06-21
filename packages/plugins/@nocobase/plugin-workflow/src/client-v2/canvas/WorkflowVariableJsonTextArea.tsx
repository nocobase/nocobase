/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css } from '@emotion/css';
import { JsonTextArea, type JsonTextAreaProps } from '@nocobase/client-v2';
import { Button } from 'antd';
import { FlowContextSelector } from '@nocobase/flow-engine';
import React, { useCallback, useMemo, useRef } from 'react';
import { insertTextAtSelection, setNativeTextAreaValue } from './textAreaInsertion';
import { formatWorkflowPathToValue } from './workflowVariableConverters';
import { useWorkflowVariableOptions, type UseWorkflowVariableOptions } from './useWorkflowVariableOptions';

export interface WorkflowVariableJsonTextAreaProps extends JsonTextAreaProps {
  variableOptions?: UseWorkflowVariableOptions;
}

const selectorButtonClassName = css`
  &:not(:hover) {
    border-right-color: transparent;
    border-top-color: transparent;
    background-color: transparent;
  }
`;

export function WorkflowVariableJsonTextArea(props: WorkflowVariableJsonTextAreaProps) {
  const { variableOptions, style, ...rest } = props;
  const wrapperRef = useRef<HTMLDivElement>(null);
  const metaTree = useWorkflowVariableOptions(variableOptions);
  const metaTreeGetter = useMemo(() => () => metaTree, [metaTree]);

  const handleVariableSelected = useCallback((selectedValue: string) => {
    if (!selectedValue) {
      return;
    }

    const input = wrapperRef.current?.querySelector('textarea');
    if (!input) {
      return;
    }

    const { nextValue, nextSelectionStart, nextSelectionEnd } = insertTextAtSelection(
      input.value,
      selectedValue,
      input.selectionStart ?? input.value.length,
      input.selectionEnd ?? input.selectionStart ?? input.value.length,
    );
    setNativeTextAreaValue(input, nextValue);

    requestAnimationFrame(() => {
      input.setSelectionRange(nextSelectionStart, nextSelectionEnd);
      input.focus();
    });
  }, []);

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%', ...style }}>
      <JsonTextArea {...rest} />
      <div style={{ position: 'absolute', insetInlineEnd: 0, insetBlockStart: 0, lineHeight: 0 }}>
        <FlowContextSelector
          metaTree={metaTreeGetter}
          disabled={rest.disabled}
          formatPathToValue={(item) => formatWorkflowPathToValue(item) ?? ''}
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
