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
import type { VariableTagProps } from './types';

export const VariableTag: React.FC<VariableTagProps> = ({ value, onClear, className, style }) => {
  return (
    <Tag
      color="blue"
      closable={!!onClear}
      onClose={onClear}
      className={className}
      style={{
        display: 'inline-block',
        lineHeight: '19px',
        margin: 0,
        padding: '2px 7px',
        borderRadius: '10px', // 椭圆形状
        width: 'fit-content', // 紧贴内容的宽度
        minWidth: 'unset', // 重置最小宽度
        maxWidth: 'none', // 无最大宽度限制
        flex: 'none', // 不参与flex拉伸
        overflow: 'visible', // 防止内容被截断
        textOverflow: 'clip',
        whiteSpace: 'nowrap',
        boxSizing: 'content-box', // 确保padding不影响宽度计算
        ...style,
      }}
    >
      {value}
    </Tag>
  );
};
