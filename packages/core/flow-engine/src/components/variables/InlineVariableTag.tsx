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
import { parseValueToPath } from './utils';

export interface InlineVariableTagProps {
  value?: string;
  onRemove?: () => void;
  className?: string;
  style?: React.CSSProperties;
  allowEdit?: boolean;
}

export const InlineVariableTag: React.FC<InlineVariableTagProps> = ({
  value,
  onRemove,
  className,
  style,
  allowEdit = true,
}) => {
  console.log('InlineVariableTag rendering with value:', value);

  const displayedValue = React.useMemo(() => {
    if (!value) return String(value);

    const path = parseValueToPath(value);
    console.log('InlineVariableTag parseValueToPath result:', path);
    return path ? path.join('/') : String(value);
  }, [value]);

  console.log('InlineVariableTag displayedValue:', displayedValue);

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
        maxWidth: '200px',
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
        {displayedValue}
      </span>
    </Tag>
  );
};
