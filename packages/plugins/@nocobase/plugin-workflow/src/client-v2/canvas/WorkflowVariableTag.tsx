/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { CloseCircleFilled } from '@ant-design/icons';
import { loadMetaTreeChildren, useFlowContext, type MetaTreeNode } from '@nocobase/flow-engine';
import { Button, Tag, theme } from 'antd';
import { css } from '@emotion/css';
import { parseWorkflowValueToPath } from './workflowVariableConverters';

export type WorkflowVariableTagProps = {
  value?: string | null;
  metaTree: MetaTreeNode[];
  onClear?: () => void;
  className?: string;
  style?: React.CSSProperties;
  status?: 'error' | 'warning';
  disabled?: boolean;
};

export function isWorkflowVariableValue(value: unknown): value is string {
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

export function WorkflowVariableTag({
  value,
  metaTree,
  onClear,
  className,
  style,
  status,
  disabled,
}: WorkflowVariableTagProps) {
  const { token } = theme.useToken();
  const ctx = useFlowContext();
  const t = useMemo(() => (typeof ctx?.t === 'function' ? ctx.t : (text: string) => text), [ctx]);
  const variablePath = useMemo(
    () => (isWorkflowVariableValue(value) ? parseWorkflowValueToPath(value) : undefined),
    [value],
  );
  const [updateFlag, setUpdateFlag] = useState(0);

  useEffect(() => {
    if (!variablePath?.length) {
      return;
    }
    let cancelled = false;
    const run = async () => {
      let nodes: MetaTreeNode[] | undefined = metaTree;
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
  }, [metaTree, variablePath]);

  const variableLabels = useMemo(() => {
    void updateFlag;
    return variablePath ? resolveVariableLabels(variablePath, metaTree, t) : [];
  }, [metaTree, t, updateFlag, variablePath]);

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
    <div
      className={css(variableValueClassName, className)}
      role="button"
      aria-label="workflow-variable-tag"
      style={{
        width: '100%',
        minWidth: 0,
        flex: '1 1 auto',
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
        ...style,
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
      {!disabled && onClear ? (
        <Button
          type="text"
          size="small"
          className="clear-button"
          aria-label="workflow-variable-tag-clear"
          onClick={onClear}
          icon={<CloseCircleFilled />}
        />
      ) : null}
    </div>
  );
}

export default WorkflowVariableTag;
