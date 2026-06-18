/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css, cx } from '@emotion/css';
import {
  FlowContextSelector,
  formatPathToValue as formatFlowPathToValue,
  useFlowContext,
  type MetaTreeNode,
} from '@nocobase/flow-engine';
import { Button, theme } from 'antd';
import type { TextAreaRef } from 'antd/es/input/TextArea';
import React, { useCallback, useMemo, useRef } from 'react';
import { JsonTextArea, type JsonTextAreaProps } from './JsonTextArea';
import { useFilteredMetaTree } from './VariableInput';

export interface VariableJsonTextAreaProps extends JsonTextAreaProps {
  namespaces?: string[];
  extraNodes?: MetaTreeNode[];
  metaTree?: MetaTreeNode[] | (() => MetaTreeNode[] | Promise<MetaTreeNode[]>);
  formatPathToValue?: (meta: MetaTreeNode) => string | undefined;
}

export const VariableJsonTextArea = React.memo((props: VariableJsonTextAreaProps) => {
  const {
    value,
    onChange,
    space = 2,
    json5 = false,
    showError = true,
    className,
    status,
    onBlur,
    namespaces,
    extraNodes,
    metaTree,
    formatPathToValue: customFormatPathToValue,
    ...textAreaProps
  } = props;
  const { token } = theme.useToken();
  const flowCtx = useFlowContext();
  const filteredMetaTree = useFilteredMetaTree({ namespaces, extraNodes });
  const ref = useRef<TextAreaRef>(null);

  const insertAtCaret = useCallback((valueToInsert: string) => {
    const textArea = ref.current?.resizableTextArea?.textArea;
    if (!textArea) return;

    const start = textArea.selectionStart ?? textArea.value.length;
    const end = textArea?.selectionEnd ?? start;
    const nextText = textArea.value.slice(0, start) + valueToInsert + textArea.value.slice(end);
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;

    nativeInputValueSetter?.call(textArea, nextText);
    textArea.dispatchEvent(new Event('input', { bubbles: true }));

    requestAnimationFrame(() => {
      const nextPosition = start + valueToInsert.length;
      textArea.setSelectionRange(start, nextPosition);
      textArea.focus();
    });
  }, []);

  const handleVariableSelected = useCallback(
    (nextValue: string) => {
      if (nextValue) {
        insertAtCaret(nextValue);
      }
    },
    [insertAtCaret],
  );

  const selectorMetaTree = useMemo(
    () => metaTree ?? filteredMetaTree ?? (() => flowCtx.getPropertyMetaTree?.() ?? []),
    [filteredMetaTree, flowCtx, metaTree],
  );

  const formatPathToValue = useMemo(() => {
    if (!customFormatPathToValue) {
      return;
    }
    return (meta: MetaTreeNode) => customFormatPathToValue(meta) ?? formatFlowPathToValue(meta);
  }, [customFormatPathToValue]);

  const wrapperClassName = useMemo(
    () => css`
      position: relative;
      width: 100%;

      .ant-input {
        width: 100%;
      }
    `,
    [],
  );

  const textAreaClassName = useMemo(
    () => css`
      font-size: ${token.fontSizeSM}px;
      font-family: ${token.fontFamilyCode};
    `,
    [token.fontFamilyCode, token.fontSizeSM],
  );

  const selectorClassName = useMemo(
    () => css`
      position: absolute;
      inset-block-start: 0;
      inset-inline-end: 0;
      z-index: 1;
      line-height: 0;

      .ant-btn {
        font-size: ${token.fontSizeSM}px;
      }
    `,
    [token.fontSizeSM],
  );

  const buttonClassName = useMemo(
    () => css`
      &:not(:hover) {
        border-inline-end-color: transparent;
        border-block-start-color: transparent;
        background-color: transparent;
      }
    `,
    [],
  );

  return (
    <div className={wrapperClassName}>
      <JsonTextArea
        {...textAreaProps}
        ref={ref}
        value={value}
        onChange={onChange}
        space={space}
        json5={json5}
        showError={showError}
        className={cx(textAreaClassName, className)}
        status={status}
        onBlur={onBlur}
        disabled={textAreaProps.disabled}
      />
      <div className={selectorClassName}>
        <FlowContextSelector
          metaTree={selectorMetaTree}
          disabled={textAreaProps.disabled}
          formatPathToValue={formatPathToValue}
          onChange={handleVariableSelected}
        >
          <Button
            aria-label="variable-json-switcher"
            disabled={textAreaProps.disabled}
            className={buttonClassName}
            style={{ fontStyle: 'italic', fontFamily: token.fontFamilyCode }}
          >
            x
          </Button>
        </FlowContextSelector>
      </div>
    </div>
  );
});

VariableJsonTextArea.displayName = 'VariableJsonTextArea';

export const VariableJSON = VariableJsonTextArea;
