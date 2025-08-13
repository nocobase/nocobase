/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Tag } from 'antd';
import { CloseCircleFilled } from '@ant-design/icons';
import { cx } from '@emotion/css';
import type { VariableTagProps } from './types';
import type { MetaTreeNode } from '../../flowContext';
import { variableContainerStyle, variableTagContainerStyle } from './styles/variableInput.styles';
import { parseValueToPath, buildFullTagTitle } from './utils';
import { useResolvedMetaTree } from './useResolvedMetaTree';
import { useRequest } from 'ahooks';

// 提取常量样式避免重新创建
const tagStyle = {
  display: 'inline-block' as const,
  lineHeight: '19px',
  margin: '4px 6px',
  padding: '2px 7px',
  borderRadius: '10px',
  width: 'fit-content',
  minWidth: 'unset',
  maxWidth: 'none',
  flex: 'none',
  overflow: 'visible' as const,
  textOverflow: 'clip' as const,
  whiteSpace: 'nowrap' as const,
  boxSizing: 'content-box' as const,
};

const clearButtonStyle = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: 0,
  display: 'inline-flex' as const,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  userSelect: 'none' as const,
};

const VariableTagComponent: React.FC<VariableTagProps> = ({
  value,
  onClear,
  className,
  style,
  metaTreeNode,
  metaTree,
}) => {
  const { resolvedMetaTree } = useResolvedMetaTree(metaTree);

  const { data: displayedValue } = useRequest(
    async () => {
      if (metaTreeNode) {
        return await buildFullTagTitle(metaTreeNode, resolvedMetaTree);
      }
      if (!value) return String(value);
      const path = parseValueToPath(value);
      return path ? path.join('/') : String(value);
    },
    { refreshDeps: [resolvedMetaTree, value, metaTreeNode] },
  );

  return (
    <div className={cx('variable', variableContainerStyle(!onClear), className)} style={style}>
      <div
        role="button"
        aria-label="variable-tag"
        style={variableTagContainerStyle(!onClear)}
        className={cx('variable-input-container', { 'ant-input-disabled': !onClear })}
      >
        <Tag color="blue" style={tagStyle}>
          {displayedValue ?? ''}
        </Tag>
      </div>
      {onClear && (
        <button
          type="button"
          aria-label="clear"
          className="clear-button"
          style={clearButtonStyle}
          onClick={onClear}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onClear();
            }
          }}
        >
          <CloseCircleFilled />
        </button>
      )}
    </div>
  );
};

export const VariableTag = React.memo(VariableTagComponent);
