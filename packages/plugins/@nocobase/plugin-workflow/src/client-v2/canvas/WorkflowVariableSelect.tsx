/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useMemo, useState } from 'react';
import { CloseCircleFilled } from '@ant-design/icons';
import { FlowContextSelector, loadMetaTreeChildren, useFlowContext, type MetaTreeNode } from '@nocobase/flow-engine';
import { Button, Input, Space, Tag, theme } from 'antd';
import { css } from '@emotion/css';
import { formatWorkflowPathToValue, parseWorkflowValueToPath } from './workflowVariableConverters';
import { useWorkflowVariableOptions, type UseWorkflowVariableOptions } from './useWorkflowVariableOptions';
import { useHideVariable } from '../components/HideVariableContext';

export type WorkflowVariableSelectProps = {
  value?: string | null;
  onChange?: (value: string | null) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
  status?: 'error' | 'warning';
  variableOptions?: UseWorkflowVariableOptions;
};

function isWorkflowVariableValue(value: unknown): value is string {
  return typeof value === 'string' && /^\{\{\s*[^{}]+?\s*\}\}$/.test(value);
}

function resolveVariableLabels(path: string[], metaTree: MetaTreeNode[], t: (text: string) => string): string[] {
  const labels: string[] = [];
  let nodes: MetaTreeNode[] | undefined = metaTree;
  for (const segment of path) {
    if (!nodes) {
      break;
    }
    const matched = nodes.find((node) => node.name === segment);
    if (!matched) {
      labels.push(segment);
      nodes = undefined;
      continue;
    }
    const title = typeof matched.title === 'string' && matched.title ? matched.title : matched.name;
    labels.push(t(title));
    nodes = Array.isArray(matched.children) ? matched.children : undefined;
  }
  return labels;
}

/**
 * Pure workflow variable selector: the left side is read-only and only shows
 * the selected variable tag (with clear) or an empty placeholder input. Users
 * must select from the workflow variable cascader and cannot type freeform
 * content after choosing a variable.
 */
export function WorkflowVariableSelect(props: WorkflowVariableSelectProps) {
  const { value, onChange, disabled, placeholder, className, style, status, variableOptions } = props;
  const hideVariable = useHideVariable();
  const metaTree = useWorkflowVariableOptions(variableOptions);
  const translatedMetaTree = useMemo(() => metaTree, [metaTree]);
  const isVariable = isWorkflowVariableValue(value);
  const hasVariableOptions = !hideVariable && translatedMetaTree.length > 0;
  const { token } = theme.useToken();
  const ctx = useFlowContext();
  const t = useMemo(() => (typeof ctx?.t === 'function' ? ctx.t : (text: string) => text), [ctx]);
  const variablePath = useMemo(() => (isVariable ? parseWorkflowValueToPath(value) : undefined), [isVariable, value]);
  const [updateFlag, setUpdateFlag] = useState(0);

  React.useEffect(() => {
    if (!isVariable || !variablePath?.length) {
      return;
    }
    let cancelled = false;
    const run = async () => {
      let nodes: MetaTreeNode[] | undefined = translatedMetaTree;
      let didLoad = false;
      for (const segment of variablePath) {
        if (!nodes) {
          break;
        }
        const matched = nodes.find((node) => node.name === segment);
        if (!matched) {
          break;
        }
        if (typeof matched.children === 'function') {
          const resolved = await loadMetaTreeChildren(matched);
          if (cancelled) {
            return;
          }
          matched.children = resolved;
          didLoad = true;
        }
        nodes = Array.isArray(matched.children) ? matched.children : undefined;
      }
      if (didLoad && !cancelled) {
        setUpdateFlag((prev) => prev + 1);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [isVariable, translatedMetaTree, variablePath]);

  const variableLabels = useMemo(() => {
    void updateFlag;
    return isVariable && variablePath ? resolveVariableLabels(variablePath, translatedMetaTree, t) : [];
  }, [isVariable, translatedMetaTree, t, updateFlag, variablePath]);

  const variableValueClassName = useMemo(
    () => css`
      &:hover .clear-button,
      &:focus-within .clear-button {
        visibility: visible;
        pointer-events: auto;
        opacity: 1;
      }

      .clear-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: ${token.fontSizeIcon}px;
        height: ${token.fontSizeIcon}px;
        padding: 0;
        color: ${token.colorTextQuaternary};
        background: transparent;
        cursor: pointer;
        visibility: hidden;
        pointer-events: none;
        opacity: 0;
        transition:
          visibility ${token.motionDurationMid} ease,
          color ${token.motionDurationMid} ease,
          opacity ${token.motionDurationSlow} ease;

        &:hover {
          color: ${token.colorTextTertiary};
          background: transparent;
        }
      }
    `,
    [token],
  );

  return (
    <Space.Compact block className={className} style={style}>
      <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
        {isVariable ? (
          <div
            className={variableValueClassName}
            role="button"
            aria-label="workflow-variable-select-value"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: token.marginXXS,
              padding: `0 ${token.paddingSM}px`,
              minHeight: token.controlHeight,
              border: `1px solid ${
                status === 'error' ? token.colorError : status === 'warning' ? token.colorWarning : token.colorBorder
              }`,
              borderRadius: token.borderRadius,
              borderTopRightRadius: 0,
              borderBottomRightRadius: 0,
              background: disabled ? token.colorBgContainerDisabled : token.colorBgContainer,
              overflow: 'hidden',
            }}
          >
            <Tag
              color="blue"
              style={{
                marginInlineEnd: 0,
                maxWidth: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {variableLabels.map((label, index) => (
                <React.Fragment key={`${label}-${index}`}>
                  {index ? ' / ' : ''}
                  {label}
                </React.Fragment>
              ))}
            </Tag>
            {!disabled ? (
              <Button
                type="text"
                size="small"
                className="clear-button"
                aria-label="workflow-variable-select-clear"
                onClick={() => onChange?.(null)}
                icon={<CloseCircleFilled />}
              />
            ) : null}
          </div>
        ) : (
          <Input
            value={undefined}
            readOnly
            disabled={disabled}
            placeholder={placeholder}
            status={status}
            style={{ width: '100%' }}
          />
        )}
      </div>
      {hasVariableOptions ? (
        <FlowContextSelector
          metaTree={translatedMetaTree}
          value={isVariable ? value : undefined}
          active={isVariable}
          disabled={disabled}
          parseValueToPath={parseWorkflowValueToPath}
          formatPathToValue={formatWorkflowPathToValue}
          onChange={(nextValue, _metaTreeNode) => {
            onChange?.(nextValue || null);
          }}
        />
      ) : null}
    </Space.Compact>
  );
}

export default WorkflowVariableSelect;
