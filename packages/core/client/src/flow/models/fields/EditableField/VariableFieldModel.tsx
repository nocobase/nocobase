/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useMemo, useCallback } from 'react';
import { Tag, theme, Space } from 'antd';
import { CloseCircleFilled } from '@ant-design/icons';
import { EditableFieldModel } from './EditableFieldModel';
import { VariableSelector } from '@nocobase/flow-engine';

const VARIABLE_REGEX = /^\{\{\s*ctx\.([^}]+?)\s*\}\}$/;

// 变量标签组件
const VariableTagComponent: React.FC<{
  value?: any;
  onChange?: (value: string) => void;
  disabled?: boolean;
  flowContext: any;
}> = ({ value = '', onChange, disabled, flowContext }) => {
  const { token } = theme.useToken();

  // 解析变量路径
  const variablePath = useMemo(() => {
    const match = value.toString().match(VARIABLE_REGEX);
    return match
      ? match[1]
          .trim()
          .split('.')
          .map((part) => part.trim())
      : [];
  }, [value]);

  // 获取变量标签
  const getVariableLabels = useCallback(
    (path: string[]): string[] => {
      try {
        const metaTree = flowContext.getPropertyMetaTree();
        const labels: string[] = [];
        let currentNodes = metaTree;

        for (let i = 0; i < path.length; i++) {
          const segment = path[i];
          const node = currentNodes.find((n) => n.name === segment);

          if (node) {
            // 安全调用 t 函数
            const translatedTitle =
              typeof flowContext.t === 'function' ? flowContext.t(node.title || node.name) : node.title || node.name;
            labels.push(translatedTitle);
            if (node.children && typeof node.children !== 'function') {
              currentNodes = node.children;
            }
          } else {
            // 安全调用 t 函数
            const translatedSegment = typeof flowContext.t === 'function' ? flowContext.t(segment) : segment;
            labels.push(translatedSegment);
          }
        }

        return labels;
      } catch (error) {
        // 安全调用 t 函数
        return path.map((segment) => (typeof flowContext.t === 'function' ? flowContext.t(segment) : segment));
      }
    },
    [flowContext],
  );

  const labels = getVariableLabels(variablePath);

  const handleClearClick = useCallback(() => {
    onChange?.('');
  }, [onChange, value]);

  return (
    <div
      style={{
        minHeight: '32px',
        border: `1px solid ${token.colorBorder}`,
        borderRadius: token.borderRadius,
        display: 'flex',
        alignItems: 'center',
        padding: '4px 11px',
        backgroundColor: disabled ? token.colorBgContainerDisabled : token.colorBgContainer,
        gap: '4px',
        position: 'relative',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <Tag
        color="blue"
        style={{
          margin: 0,
          fontSize: '12px',
          display: 'flex',
          alignItems: 'center',
          maxWidth: 'calc(100% - 20px)',
        }}
      >
        <span
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {labels.join(' / ')}
        </span>
      </Tag>

      {!disabled && (
        <CloseCircleFilled
          style={{
            position: 'absolute',
            right: '8px',
            color: token.colorTextQuaternary,
            cursor: 'pointer',
            fontSize: '12px',
          }}
          onClick={handleClearClick}
        />
      )}
    </div>
  );
};

// 智能变量字段组件 - 根据值类型动态显示不同组件
const SmartVariableComponent: React.FC<{
  value?: any;
  onChange?: (value: any) => void;
  disabled?: boolean;
  originalComponent: any;
  originalComponentProps: any;
  flowContext: any;
  variableChange?: (value: string[], optionPath: any[]) => void;
  variableValue?: string[];
}> = ({
  value,
  onChange,
  disabled,
  originalComponent: OriginalComponent,
  originalComponentProps,
  flowContext,
  variableChange,
  variableValue,
}) => {
  const { token } = theme.useToken();

  // 判断当前值是否为变量格式
  const isVariableValue = useMemo(() => {
    return typeof value === 'string' && VARIABLE_REGEX.test(value);
  }, [value]);

  // 如果是变量值，显示变量标签 + VariableSelector
  if (isVariableValue) {
    if (variableChange && variableValue) {
      return (
        <Space.Compact style={{ width: '100%' }}>
          <div style={{ flex: 1 }}>
            <VariableTagComponent value={value} onChange={onChange} disabled={disabled} flowContext={flowContext} />
          </div>
          <VariableSelector
            value={variableValue}
            onChange={variableChange}
            disabled={disabled}
            isPrimary={variableValue && variableValue[0] !== ''}
            buttonStyle={{
              borderTopLeftRadius: 0,
              borderBottomLeftRadius: 0,
              height: '32px',
            }}
            buttonContent="x"
          />
        </Space.Compact>
      );
    } else {
      // 如果没有变量选择器功能，只显示变量标签
      return <VariableTagComponent value={value} onChange={onChange} disabled={disabled} flowContext={flowContext} />;
    }
  }

  // 如果不是变量值，显示原始组件，但需要用 Space.Compact 包装来集成 VariableSelector
  if (variableChange && variableValue) {
    return (
      <Space.Compact style={{ width: '100%' }}>
        <div style={{ flex: 1 }}>
          <OriginalComponent {...originalComponentProps} value={value} onChange={onChange} disabled={disabled} />
        </div>
        <VariableSelector
          value={variableValue}
          onChange={variableChange}
          disabled={disabled}
          isPrimary={variableValue && variableValue[0] !== ''}
          buttonStyle={{
            borderTopLeftRadius: 0,
            borderBottomLeftRadius: 0,
            height: '32px',
          }}
          buttonContent="x"
        />
      </Space.Compact>
    );
  }

  // 普通模式，只显示原始组件
  return <OriginalComponent {...originalComponentProps} value={value} onChange={onChange} disabled={disabled} />;
};

// 变量字段模型 - 智能切换显示变量标签或原始组件
export class VariableFieldModel extends EditableFieldModel {
  originalComponent: any = null;
  originalComponentProps: any = {};
  variableChange: any = null;
  variableValue: any = null;

  get component() {
    return [
      SmartVariableComponent,
      {
        originalComponent: this.originalComponent,
        originalComponentProps: this.originalComponentProps,
        flowContext: this.context,
        variableChange: this.variableChange,
        variableValue: this.variableValue,
      },
    ];
  }
}
