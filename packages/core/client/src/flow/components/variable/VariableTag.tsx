/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CloseOutlined } from '@ant-design/icons';
import { Tag } from 'antd';
import React, { useEffect, useState } from 'react';
import { MetaTreeNode } from '@nocobase/flow-engine';

interface VariableTagProps {
  value: string;
  metaTree?: MetaTreeNode[] | (() => Promise<MetaTreeNode[]>);
  onClear?: () => void;
  style?: React.CSSProperties;
}

export const VariableTag: React.FC<VariableTagProps> = ({ value, metaTree, onClear, style }) => {
  const [displayLabel, setDisplayLabel] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // 解析变量值，提取路径
  const parseVariablePath = (variableValue: string): string[] | null => {
    const variablePattern = /^\{\{\s*ctx\.([^}]+?)\s*\}\}$/;
    const match = variableValue.match(variablePattern);

    if (match) {
      const path = match[1];
      return path.split('.');
    }

    return null;
  };

  // 根据路径在 metaTree 中查找对应的 label
  const findLabelByPath = async (pathArray: string[], nodes: MetaTreeNode[]): Promise<string> => {
    if (pathArray.length === 0) return '';

    const [currentPath, ...remainingPath] = pathArray;
    const currentNode = nodes.find((node) => node.name === currentPath);

    if (!currentNode) {
      // 如果找不到节点，返回原始路径
      return pathArray.join('/');
    }

    // 如果是最后一个路径段，返回当前节点的 title
    if (remainingPath.length === 0) {
      return currentNode.title || currentNode.name;
    }

    // 如果还有剩余路径，需要继续查找子节点
    if (currentNode.children) {
      let childNodes: MetaTreeNode[] = [];

      if (typeof currentNode.children === 'function') {
        // 异步加载子节点
        try {
          childNodes = await currentNode.children();
        } catch (error) {
          console.warn(`Failed to load children for ${currentPath}:`, error);
          return pathArray.join('/');
        }
      } else {
        childNodes = currentNode.children;
      }

      // 递归查找剩余路径
      const childLabel = await findLabelByPath(remainingPath, childNodes);
      return `${currentNode.title || currentNode.name}/${childLabel}`;
    }

    // 如果没有子节点但还有剩余路径，返回当前找到的部分
    return currentNode.title || currentNode.name;
  };

  // 预加载并获取显示标签
  const loadDisplayLabel = async () => {
    if (!metaTree || !value) {
      setDisplayLabel(value);
      return;
    }

    const pathArray = parseVariablePath(value);
    if (!pathArray) {
      setDisplayLabel(value);
      return;
    }

    setLoading(true);
    try {
      let rootNodes: MetaTreeNode[] = [];

      if (typeof metaTree === 'function') {
        rootNodes = await metaTree();
      } else {
        rootNodes = metaTree;
      }

      const label = await findLabelByPath(pathArray, rootNodes);
      setDisplayLabel(label);
    } catch (error) {
      console.warn('Failed to load variable label:', error);
      // 降级到显示路径（去掉 ctx 前缀）
      setDisplayLabel(pathArray.join('/'));
    } finally {
      setLoading(false);
    }
  };

  // 当 value 或 metaTree 变化时，重新加载标签
  useEffect(() => {
    loadDisplayLabel();
  }, [value, metaTree]);

  // 如果没有解析出路径，直接显示原值
  const pathArray = parseVariablePath(value);
  const fallbackDisplay = pathArray ? pathArray.join('/') : value;

  return (
    <div
      style={{
        flex: 1,
        border: '1px solid #d9d9d9',
        borderRadius: '6px 0 0 6px',
        padding: '4px 8px',
        background: '#ffffff', // 白色背景，不是 disabled 色
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '100%', // 自适应容器高度
        ...style,
      }}
    >
      <Tag
        style={{
          margin: 0,
          borderRadius: '10px', // 圆角标签
          fontSize: '10px',
          lineHeight: '16px',
          padding: '0 6px',
          border: '1px solid #1890ff',
          background: '#e6f7ff',
          color: '#1890ff',
        }}
      >
        {loading ? 'Loading...' : displayLabel || fallbackDisplay}
      </Tag>

      {/* 清除图标 */}
      {onClear && (
        <CloseOutlined
          style={{
            fontSize: '12px',
            color: '#bfbfbf',
            cursor: 'pointer',
            padding: '2px',
            marginLeft: '4px',
          }}
          onClick={onClear}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#8c8c8c';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#bfbfbf';
          }}
        />
      )}
    </div>
  );
};
