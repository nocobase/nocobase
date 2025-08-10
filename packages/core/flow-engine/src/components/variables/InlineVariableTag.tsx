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
import { CloseOutlined } from '@ant-design/icons';
import { parseValueToPath, buildFullTagTitle } from './utils';
import type { ContextSelectorItem } from './types';
import type { MetaTreeNode } from '../../flowContext';
import { useResolvedMetaTree } from './useResolvedMetaTree';
import { useRequest } from 'ahooks';

export interface InlineVariableTagProps {
  value?: string;
  onRemove?: () => void;
  className?: string;
  style?: React.CSSProperties;
  allowEdit?: boolean;
  contextSelectorItem?: ContextSelectorItem;
  metaTree?: MetaTreeNode[] | (() => MetaTreeNode[] | Promise<MetaTreeNode[]>);
  maxWidth?: string | number;
}

export const InlineVariableTag: React.FC<InlineVariableTagProps> = ({
  value,
  onRemove,
  className,
  style,
  allowEdit = true,
  contextSelectorItem,
  metaTree,
  maxWidth = '400px',
}) => {
  const { resolvedMetaTree } = useResolvedMetaTree(metaTree);

  const { data: displayedValue } = useRequest(
    async () => {
      // 优先使用 contextSelectorItem 和 metaTree 来构建完整的 title 路径
      if (contextSelectorItem) {
        return await buildFullTagTitle(contextSelectorItem, resolvedMetaTree);
      }

      // 后备方案：从 value 解析路径
      if (!value) return String(value);
      const path = parseValueToPath(value);
      return path ? path.join('/') : String(value);
    },
    { refreshDeps: [resolvedMetaTree, value, contextSelectorItem] },
  );

  return (
    <Tag
      color="blue"
      closable={allowEdit && !!onRemove}
      onClose={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onRemove?.();
      }}
      closeIcon={<CloseOutlined />}
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        margin: 0, // 移除默认间距，由父组件控制
        padding: '2px 6px',
        fontSize: '12px',
        lineHeight: '16px', // 与22px行高匹配
        height: '20px', // 与行高相匹配
        borderRadius: '4px',
        maxWidth: maxWidth, // 可配置的最大宽度
        cursor: 'default',
        userSelect: 'none',
        verticalAlign: 'middle', // 使用middle对齐而不是translateY
        ...style,
      }}
    >
      <span
        style={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
        title={displayedValue}
      >
        {displayedValue ?? ''}
      </span>
    </Tag>
  );
};
