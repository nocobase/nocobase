/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { Input, Cascader, Tag, Button, Space, theme } from 'antd';
import { CloseCircleFilled } from '@ant-design/icons';
import { useFlowSettingsContext } from '../../hooks';
import { MetaTreeNode } from '../../flowContext';
import { useTranslation } from 'react-i18next';

interface VariableInputProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否显示清除按钮 */
  allowClear?: boolean;
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** CSS类名 */
  className?: string;
  /** 模式：单变量或多变量 */
  mode?: 'single' | 'multiple';
  /** 是否从model渲染字段组件，默认根据当前model是否为EditableFieldModel实例自动判断 */
  renderFromModel?: boolean;
}

interface CascaderOption {
  value: string;
  label: string;
  children?: CascaderOption[];
  isLeaf?: boolean;
}

const VARIABLE_REGEX = /\{\{\s*ctx\.([^}]+?)\s*\}\}/g;
const CONSTANT_TYPES = [
  { value: 'string', label: 'String', default: '' },
  { value: 'number', label: 'Number', default: '0' },
  { value: 'boolean', label: 'Boolean', default: 'false' },
  { value: 'date', label: 'Date', default: () => new Date().toISOString() },
];

const getConstantDefault = (type: string): string => {
  const constantType = CONSTANT_TYPES.find((t) => t.value === type);
  return constantType
    ? typeof constantType.default === 'function'
      ? constantType.default()
      : constantType.default
    : '';
};

const convertMetaTreeToCascaderData = (nodes: MetaTreeNode[]): CascaderOption[] => {
  return nodes.map((node) => ({
    value: node.name,
    label: node.title || node.name,
    children: node.children?.length ? convertMetaTreeToCascaderData(node.children) : undefined,
    isLeaf: !node.children?.length,
  }));
};

/**
 * 变量输入组件
 *
 * 支持文本输入和变量选择的复合输入框，可以在单变量和多变量模式间切换。
 * 变量以 {{ ctx.xxx }} 格式显示为可删除的标签。
 *
 * 当当前 flowContext.model 是 EditableFieldModel 实例时，默认从 model.component
 * 渲染字段组件，提供更丰富的字段类型支持。
 *
 * @param props 组件属性
 * @returns React组件
 */
export const VariableInput: React.FC<VariableInputProps> = ({
  value = '',
  onChange,
  placeholder,
  disabled = false,
  allowClear = true,
  style,
  className,
  mode = 'single',
  renderFromModel = false, // TODO: 这里为true就有问题
}) => {
  const { t } = useTranslation();
  const { token } = theme.useToken();
  const inputRef = useRef<any>(null);
  const [isFocused, setIsFocused] = useState(false);
  const flowContext = useFlowSettingsContext();

  const cascaderData = useMemo(() => convertMetaTreeToCascaderData(flowContext.getPropertyMetaTree()), [flowContext]);

  const options = useMemo(
    () => [
      { value: '', label: t('Null') },
      { value: ' ', label: t('Constant'), children: CONSTANT_TYPES },
      ...cascaderData,
    ],
    [cascaderData, t],
  );

  // 检查是否是 EditableFieldModel 或其子类
  const isEditableFieldModel = useCallback((model: any) => {
    if (!model?.flowEngine) return false;

    const EditableFieldModelClass = model.flowEngine.getModelClass('EditableFieldModel');
    if (!EditableFieldModelClass) return false;

    return model instanceof EditableFieldModelClass;
  }, []);

  // 检查是否应该从model渲染组件
  const shouldRenderFromModel = renderFromModel ?? isEditableFieldModel(flowContext.model);

  // 获取model组件配置
  const modelComponent = useMemo(() => {
    if (!shouldRenderFromModel || !flowContext.model['component']) return null;

    const [Component, componentProps = {}] = flowContext.model['component'];
    if (!Component) return null;

    const parseValue = (val: string) => {
      if (!val) return undefined;
      try {
        return JSON.parse(val);
      } catch {
        return val;
      }
    };

    const stringifyValue = (val: any) => {
      if (val == null) return '';
      if (typeof val === 'string') return val;
      try {
        return JSON.stringify(val);
      } catch {
        return String(val);
      }
    };

    return {
      Component,
      props: {
        ...componentProps,
        value: parseValue(value),
        onChange: (val: any) => onChange?.(stringifyValue(val)),
        placeholder,
        disabled,
        style: { width: '100%', ...componentProps.style },
      },
    };
  }, [shouldRenderFromModel, flowContext.model['component'], value, onChange, placeholder, disabled]);

  const getVariableLabels = useCallback(
    (variablePath: string[]): string[] => {
      if (!cascaderData.length) return variablePath;

      let currentOptions = cascaderData;
      const labels: string[] = [];

      for (const key of variablePath) {
        const option = currentOptions.find((opt) => opt.value === key);
        if (!option) return variablePath;
        labels.push(option.label);
        currentOptions = option.children || [];
      }

      return labels;
    },
    [cascaderData],
  );

  const { displayParts, hasVariable } = useMemo(() => {
    if (!value) return { displayParts: [], hasVariable: false };

    const parts: Array<{ type: 'text' | 'variable'; content: string; labels?: string[] }> = [];
    let lastIndex = 0;
    let match;
    let foundVariable = false;

    VARIABLE_REGEX.lastIndex = 0;
    while ((match = VARIABLE_REGEX.exec(value)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ type: 'text', content: value.slice(lastIndex, match.index) });
      }

      const variablePath = match[1]
        .trim()
        .split('.')
        .map((part) => part.trim());
      const labels = getVariableLabels(variablePath);
      parts.push({ type: 'variable', content: match[0], labels });
      foundVariable = true;

      lastIndex = VARIABLE_REGEX.lastIndex;
    }

    if (lastIndex < value.length) {
      parts.push({ type: 'text', content: value.slice(lastIndex) });
    }

    return { displayParts: parts, hasVariable: foundVariable };
  }, [value, getVariableLabels]);

  const isReadOnlyInSingleMode = mode === 'single' && hasVariable;

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!isReadOnlyInSingleMode) {
        onChange?.(e.target.value);
      }
    },
    [onChange, isReadOnlyInSingleMode],
  );

  const handleVariableDelete = useCallback(
    (variableToDelete: string) => {
      if (!value) return;
      onChange?.(mode === 'single' ? '' : value.replace(variableToDelete, ''));
    },
    [value, onChange, mode],
  );

  const handleCascaderChange = useCallback(
    (next: string[], optionPath: any[]) => {
      if (next[0] === '') {
        onChange?.('');
      } else if (next[0] === ' ' && next[1]) {
        onChange?.(getConstantDefault(next[1]));
      } else {
        const lastOption = optionPath[optionPath.length - 1];
        if (lastOption?.isLeaf !== false && !lastOption?.children?.length) {
          const newVariable = `{{ ctx.${next.join('.')} }}`;
          onChange?.(mode === 'single' ? newVariable : (value || '') + newVariable);
        }
      }
    },
    [value, onChange, mode],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (isReadOnlyInSingleMode && e.key !== 'Tab') {
        e.preventDefault();
      }
    },
    [isReadOnlyInSingleMode],
  );

  // 如果启用了 model 渲染且有可用的组件，则渲染它
  if (modelComponent && !hasVariable) {
    const { Component, props } = modelComponent;

    return (
      <Space.Compact style={{ display: 'flex', width: '100%', ...style }} className={className}>
        <div
          style={{
            flex: 1,
            borderRadius: `${token.borderRadius}px 0 0 ${token.borderRadius}px`,
            borderRight: 'none',
            display: 'flex',
            alignItems: 'stretch',
          }}
        >
          <Component {...props} />
        </div>

        <Cascader options={options} onChange={handleCascaderChange} changeOnSelect={false} disabled={disabled}>
          <Button
            type={hasVariable ? 'primary' : 'default'}
            disabled={disabled}
            style={{
              borderRadius: `0 ${token.borderRadius}px ${token.borderRadius}px 0`,
              height: '32px',
              borderColor: isFocused ? token.colorPrimary : undefined,
            }}
          >
            x
          </Button>
        </Cascader>
      </Space.Compact>
    );
  }

  return (
    <Space.Compact style={{ display: 'flex', width: '100%', ...style }} className={className}>
      {/* 根据是否有变量选择不同的显示方式 */}
      {hasVariable ? (
        <div
          style={{
            flex: 1,
            height: '32px',
            padding: '4px 11px',
            border: `1px solid ${isFocused ? token.colorPrimary : token.colorBorder}`,
            borderRadius: `${token.borderRadius}px 0 0 ${token.borderRadius}px`,
            borderRight: 'none',
            background: token.colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            cursor: isReadOnlyInSingleMode ? 'default' : 'text',
            position: 'relative',
          }}
          onClick={() => !isReadOnlyInSingleMode && inputRef.current?.focus()}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        >
          {displayParts.map((part, index) => {
            if (part.type === 'variable') {
              return (
                <Tag
                  key={`${part.content}-${index}`}
                  color="blue"
                  closable
                  onClose={(e) => {
                    e?.stopPropagation();
                    handleVariableDelete(part.content);
                  }}
                  style={{ margin: 0, fontSize: '12px' }}
                >
                  {part.labels?.join(' / ')}
                </Tag>
              );
            } else {
              return <span key={`text-${index}`}>{part.content}</span>;
            }
          })}

          <input
            ref={inputRef}
            value={value}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            readOnly={isReadOnlyInSingleMode}
            style={{ position: 'absolute', left: '-9999px', opacity: 0, pointerEvents: 'none' }}
          />
          {allowClear && value && (
            <CloseCircleFilled
              style={{
                position: 'absolute',
                right: '8px',
                color: token.colorTextQuaternary,
                cursor: 'pointer',
                fontSize: '12px',
              }}
              onClick={(e) => {
                e.stopPropagation();
                onChange?.('');
              }}
            />
          )}
        </div>
      ) : (
        // 没有变量时：普通输入框
        <Input
          ref={inputRef}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          disabled={disabled}
          allowClear={allowClear}
          style={{
            flex: 1,
            borderRadius: `${token.borderRadius}px 0 0 ${token.borderRadius}px`,
            borderRight: 'none',
          }}
        />
      )}

      <Cascader options={options} onChange={handleCascaderChange} changeOnSelect={false} disabled={disabled}>
        <Button
          type={hasVariable ? 'primary' : 'default'}
          disabled={disabled}
          style={{
            borderRadius: `0 ${token.borderRadius}px ${token.borderRadius}px 0`,
            height: '32px',
            borderColor: isFocused ? token.colorPrimary : undefined,
          }}
        >
          x
        </Button>
      </Cascader>
    </Space.Compact>
  );
};
