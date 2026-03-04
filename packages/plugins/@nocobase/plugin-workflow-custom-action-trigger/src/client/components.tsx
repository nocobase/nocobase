/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useCallback, useRef, useMemo } from 'react';
import { css } from '@emotion/css';
import {
  Action,
  Input as ClientInput,
  Variable,
  useCurrentUserVariable,
  useCurrentRoleVariable,
  useAPITokenVariable,
} from '@nocobase/client';
import { FlowContextSelector, MetaTreeNode, useFlowContext } from '@nocobase/flow-engine';
import { TriggerCollectionRecordSelect, WorkflowVariableJSON } from '@nocobase/plugin-workflow/client';

import { useGlobalTriggerWorkflowCustomActionProps } from './hooks';
import { useCurrentWorkflowContext } from '@nocobase/plugin-workflow/client';
import { CONTEXT_TYPE } from '../common/constants';

export function TriggerScopeProvider(props) {
  const workflow = useCurrentWorkflowContext();
  return props.types.includes(workflow.config.type) ||
    (props.types.includes(CONTEXT_TYPE.GLOBAL) && !workflow.config.type)
    ? props.children
    : null;
}

export function TriggerDataInput(props) {
  const workflow = useCurrentWorkflowContext();
  if (workflow.config.type) {
    return <TriggerCollectionRecordSelect {...props} />;
  }
  return <WorkflowVariableJSON changeOnSelect autoSize={{ minRows: 6 }} {...props} />;
}

export function GlobalTriggerWorkflowAction(props) {
  const { onClick } = useGlobalTriggerWorkflowCustomActionProps();
  return <Action {...props} onClick={onClick} />;
}

// NOTE: https://stackoverflow.com/questions/23892547/what-is-the-best-way-to-trigger-onchange-event-in-react-js
function setNativeInputValue(input, value) {
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(input.constructor.prototype, 'value')?.set;
  nativeInputValueSetter?.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

/**
 * JSON input with flow-engine variable support.
 * Inserts {{ ctx.xxx }} expressions; resolved via resolveExpressions at trigger time.
 */
export function ContextDataJsonInput({ value, onChange, ...props }) {
  const inputRef = useRef<any>(null);
  const flowCtx = useFlowContext() as any;

  const metaTree = useCallback(async () => {
    return ((flowCtx as any)?.getPropertyMetaTree?.() as MetaTreeNode[]) || [];
  }, [flowCtx]);

  const handleVariableInsert = useCallback((variableExpr: string) => {
    if (!inputRef.current) return;
    const textArea = inputRef.current.resizableTextArea?.textArea;
    if (!textArea) return;
    const start = textArea.selectionStart ?? 0;
    const end = textArea.selectionEnd ?? 0;
    const nextValue = textArea.value.slice(0, start) + variableExpr + textArea.value.slice(end);
    const nextPos = start + variableExpr.length;
    setNativeInputValue(textArea, nextValue);
    textArea.setSelectionRange(nextPos, nextPos);
    textArea.focus();
  }, []);

  return (
    <div
      className={css`
        position: relative;
        .ant-input {
          width: 100%;
        }
      `}
    >
      <ClientInput.JSON autoSize={{ minRows: 5 }} {...props} ref={inputRef} value={value} onChange={onChange} />
      <div
        className={css`
          position: absolute;
          right: 0;
          top: 0;
        `}
      >
        <FlowContextSelector metaTree={metaTree} onChange={handleVariableInsert} />
      </div>
    </div>
  );
}

/**
 * JSON input with variable reference support for global trigger context data (traditional/hook-based path).
 * Variables (e.g. {{$user.id}}) are resolved at click time in the hook.
 */
export function GlobalContextDataInput(props) {
  const { currentUserSettings } = useCurrentUserVariable({ noDisabled: true });
  const { currentRoleSettings } = useCurrentRoleVariable({ noDisabled: true });
  const { apiTokenSettings } = useAPITokenVariable({ noDisabled: true });

  const scope = useMemo(
    () => [currentUserSettings, currentRoleSettings, apiTokenSettings].filter(Boolean),
    [currentUserSettings, currentRoleSettings, apiTokenSettings],
  );

  return <Variable.JSON changeOnSelect scope={scope} {...props} />;
}
