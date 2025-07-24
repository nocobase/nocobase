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
import { useField, useForm } from '@formily/react';
import { useFlowSettingsContext } from '../../hooks';
import { MetaTreeNode, FlowContext } from '../../flowContext';
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
  /** 是否使用model的stepInputComponent，默认为false */
  useStepInputComponent?: boolean;
}

interface CascaderOption {
  value: string;
  label: string;
  children?: CascaderOption[];
  isLeaf?: boolean;
}

const VARIABLE_REGEX = /\{\{\s*ctx\.([^}]+?)\s*\}\}/g;

// 提取变量路径的辅助函数
const extractVariablePaths = (value: string): string[][] => {
  // 确保 value 是字符串类型
  if (typeof value !== 'string' || !value) {
    return [];
  }
  const matches = value.matchAll(VARIABLE_REGEX);
  return Array.from(matches, (match) =>
    match[1]
      .trim()
      .split('.')
      .map((part) => part.trim()),
  );
};

// 解析单个变量路径
const parseVariablePath = (pathStr: string): string[] => {
  return pathStr
    .trim()
    .split('.')
    .map((part) => part.trim());
};

const convertMetaTreeToCascaderData = (nodes: MetaTreeNode[], t: (key: string) => string): CascaderOption[] => {
  return nodes
    .map((node) => {
      // 从 meta 中检查是否有 hide 属性，如果为 true 则跳过
      const meta = node as any;
      if (meta.hide === true) {
        return null;
      }

      return {
        value: node.name,
        label: t(node.title || node.name),
        children: node.children
          ? typeof node.children === 'function'
            ? [] // 异步函数，留空待加载
            : convertMetaTreeToCascaderData(node.children, t).filter(Boolean) // 过滤掉null值
          : undefined,
        isLeaf: !node.children,
      };
    })
    .filter(Boolean); // 过滤掉null值
};

/**
 * 变量输入组件
 *
 * 支持文本输入和变量选择的复合输入框，可以在单变量和多变量模式间切换。
 * 变量以 {{ ctx.xxx }} 格式显示为可删除的标签。
 *
 * 当 useStepInputComponent 为 true 且 flowContext.model 有 stepInputComponent 时，
 * 使用自定义组件渲染，提供更丰富的字段类型支持。
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
  useStepInputComponent = false,
}) => {
  const { t } = useTranslation();
  const { token } = theme.useToken();
  const inputRef = useRef<any>(null);
  const [isFocused, setIsFocused] = useState(false);
  const flowContext = useFlowSettingsContext();

  // 使用 Formily hooks 获取当前表单和字段上下文
  const form = useForm();
  const field = useField();

  // 添加日志监听字段值变化
  useEffect(() => {
    console.log('[VariableInput] Field value changed:', {
      fieldValue: 'value' in field ? field.value : undefined,
      propsValue: value,
      fieldPath: field?.path || field?.address,
    });
  }, [field, value]);

  // 同步外部 value 到 field
  useEffect(() => {
    if ('value' in field && 'setValue' in field && field.value !== value) {
      console.log('[VariableInput] Syncing props value to field:', {
        propsValue: value,
        currentFieldValue: field.value,
      });
      (field as any).setValue(value);
    }
  }, [value, field]);

  const [cascaderData, setCascaderData] = useState<CascaderOption[]>([]);
  const [metaTreeCache, setMetaTreeCache] = useState<Map<string, MetaTreeNode[]>>(new Map());
  const [labelCache, setLabelCache] = useState<Map<string, string>>(new Map());

  // 初始化数据
  useEffect(() => {
    try {
      const metaTree = flowContext.getPropertyMetaTree();
      const cascaderOptions = convertMetaTreeToCascaderData(metaTree, flowContext.t);
      setCascaderData(cascaderOptions);

      // 缓存根级别的MetaTreeNode
      setMetaTreeCache(new Map([['root', metaTree]]));
    } catch (error) {
      console.error('Failed to get property meta tree:', error);
      setCascaderData([]);
    }
  }, [flowContext]);

  // 预加载当前值中的变量标签
  useEffect(() => {
    // 确保 value 是字符串类型
    const stringValue = typeof value === 'string' ? value : value ? String(value) : '';

    if (!stringValue || !metaTreeCache.has('root')) return;

    const variablePaths = extractVariablePaths(stringValue);
    if (variablePaths.length === 0) return;

    const newLabels = new Map<string, string>();

    for (const variablePath of variablePaths) {
      let currentNodes = metaTreeCache.get('root') || [];

      for (let i = 0; i < variablePath.length; i++) {
        const segment = variablePath[i];
        const cacheKey = variablePath.slice(0, i + 1).join('.');

        const node = currentNodes.find((n) => n.name === segment);
        if (node) {
          newLabels.set(cacheKey, flowContext.t(node.title || node.name));

          if (node.children && typeof node.children !== 'function') {
            currentNodes = node.children;
          }
        } else {
          newLabels.set(cacheKey, flowContext.t(segment));
        }
      }
    }

    if (newLabels.size > 0) {
      setLabelCache((prev) => new Map([...prev, ...newLabels]));
    }
  }, [value, metaTreeCache, flowContext]);

  // 动态加载子菜单
  const loadData = useCallback(
    async (selectedOptions: any[]) => {
      const targetOption = selectedOptions[selectedOptions.length - 1];
      if (!targetOption || targetOption.children?.length > 0) return;

      try {
        // 构建路径
        const path = selectedOptions.map((opt) => opt.value);
        const pathKey = path.join('.');

        // 查找对应的MetaTreeNode
        let currentNodes = metaTreeCache.get('root') || [];
        let targetNode: MetaTreeNode | undefined;

        for (const pathSegment of path) {
          targetNode = currentNodes.find((node) => node.name === pathSegment);
          if (!targetNode) break;

          if (targetNode.children) {
            if (typeof targetNode.children === 'function') {
              // 如果是异步函数，需要调用获取子节点
              const cacheKey = path.slice(0, path.indexOf(pathSegment) + 1).join('.');
              if (!metaTreeCache.has(cacheKey)) {
                const childNodes = await targetNode.children();
                const newCache = new Map(metaTreeCache);
                newCache.set(cacheKey, childNodes);
                setMetaTreeCache(newCache);
                currentNodes = childNodes;
              } else {
                currentNodes = metaTreeCache.get(cacheKey) || [];
              }
            } else {
              currentNodes = targetNode.children;
            }
          }
        }

        // 如果找到目标节点且有异步children，加载它们
        if (targetNode?.children && typeof targetNode.children === 'function') {
          const childNodes = await targetNode.children();
          const childOptions = convertMetaTreeToCascaderData(childNodes, flowContext.t);

          // 缓存子节点
          const newCache = new Map(metaTreeCache);
          newCache.set(pathKey, childNodes);
          setMetaTreeCache(newCache);

          // 更新cascader选项
          targetOption.children = childOptions;
          targetOption.isLeaf = childOptions.length === 0;
          setCascaderData([...cascaderData]);
        }
      } catch (error) {
        console.error('Failed to load cascader data:', error);
        targetOption.isLeaf = true;
        setCascaderData([...cascaderData]);
      }
    },
    [flowContext, cascaderData, metaTreeCache],
  );

  const options = useMemo(
    () => [{ value: '', label: t('Null') }, { value: 'constant', label: t('Constant') }, ...cascaderData],
    [cascaderData, t],
  );

  // 创建 step input 渲染组件
  const stepInputContent = useMemo(() => {
    if (!useStepInputComponent || !flowContext.model?.stepInputComponent) return null;

    const { stepInputComponent } = flowContext.model;

    // 创建新的 FlowContext，委托给原始的 flowContext
    const stepInputContext = new FlowContext();

    // 添加委托，让新上下文可以访问原始上下文的所有属性
    stepInputContext.addDelegate(flowContext);

    // 直接提供 value 和 onChange，而不是通过 field
    stepInputContext.defineProperty('value', {
      value: value,
    });

    stepInputContext.defineProperty('onChange', {
      value: onChange,
    });

    // 为了兼容性，仍然提供 field，但 stepInputComponent 应该使用 value/onChange
    stepInputContext.defineProperty('field', {
      value: field,
    });

    console.log('[VariableInput stepInputContent] Context info:', {
      hasStepInputComponent: !!stepInputComponent,
      contextValue: value,
      contextOnChange: !!onChange,
      fieldValue: 'value' in field ? field.value : undefined,
      fieldPath: field?.path || field?.address,
    });

    // 处理不同类型的 stepInputComponent
    if (typeof stepInputComponent === 'function') {
      try {
        // 先尝试作为函数调用，看是否返回 JSX
        const result = (stepInputComponent as (ctx: any) => React.ReactNode)(stepInputContext);
        if (React.isValidElement(result) || typeof result === 'string' || result === null) {
          // 直接返回 JSX 元素
          return result;
        } else {
          // 如果返回的不是 JSX，那么 stepInputComponent 可能是一个 React 组件
          // （如 observer 包装的组件）
          const ComponentType = stepInputComponent as React.ComponentType<any>;
          return <ComponentType />;
        }
      } catch (error: any) {
        // 如果调用失败，说明 stepInputComponent 是一个 React 组件而不是函数
        console.warn('stepInputComponent is not a function, treating as React component:', error.message);
        const ComponentType = stepInputComponent as React.ComponentType<any>;
        return <ComponentType />;
      }
    } else if (React.isValidElement(stepInputComponent)) {
      return stepInputComponent;
    } else {
      return stepInputComponent;
    }
  }, [useStepInputComponent, flowContext, field, value, onChange]);

  // 获取变量标签，优先从缓存获取，否则直接翻译
  const getVariableLabels = useCallback(
    (variablePath: string[]): string[] => {
      return variablePath.map((segment, index) => {
        const cacheKey = variablePath.slice(0, index + 1).join('.');
        return labelCache.get(cacheKey) || flowContext.t(segment);
      });
    },
    [labelCache, flowContext],
  );

  const { displayParts, hasVariable, isConstant, cascaderValue } = useMemo(() => {
    // 确保 value 是字符串类型，如果不是则转换
    const stringValue = typeof value === 'string' ? value : value ? String(value) : '';

    if (!stringValue) return { displayParts: [], hasVariable: false, isConstant: false, cascaderValue: [''] };

    const parts: Array<{ type: 'text' | 'variable'; content: string; labels?: string[] }> = [];
    let lastIndex = 0;
    let foundVariable = false;

    VARIABLE_REGEX.lastIndex = 0;
    let match;
    while ((match = VARIABLE_REGEX.exec(stringValue)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ type: 'text', content: stringValue.slice(lastIndex, match.index) });
      }

      const variablePath = parseVariablePath(match[1]);
      const labels = getVariableLabels(variablePath);
      parts.push({ type: 'variable', content: match[0], labels });
      foundVariable = true;

      lastIndex = VARIABLE_REGEX.lastIndex;
    }

    if (lastIndex < stringValue.length) {
      parts.push({ type: 'text', content: stringValue.slice(lastIndex) });
    }

    // 计算 cascaderValue
    const isConstant = stringValue && !foundVariable;
    let cascaderValue = [''];

    if (foundVariable) {
      const regex = mode === 'single' ? /^\{\{\s*ctx\.([^}]+?)\s*\}\}$/ : VARIABLE_REGEX;
      const varMatch = stringValue.match(regex);
      if (varMatch) {
        cascaderValue = parseVariablePath(varMatch[1]);
      }
    } else if (isConstant) {
      cascaderValue = ['constant'];
    }

    return { displayParts: parts, hasVariable: foundVariable, isConstant, cascaderValue };
  }, [value, mode, getVariableLabels]);

  const isReadOnlyInSingleMode = mode === 'single' && hasVariable;

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      console.log('[VariableInput handleInputChange]', {
        newValue: e.target.value,
        isReadOnly: isReadOnlyInSingleMode,
      });
      if (!isReadOnlyInSingleMode) {
        onChange?.(e.target.value);
      }
    },
    [onChange, isReadOnlyInSingleMode],
  );

  const handleVariableDelete = useCallback(
    (variableToDelete: string) => {
      const stringValue = typeof value === 'string' ? value : value ? String(value) : '';
      if (!stringValue) return;
      onChange?.(mode === 'single' ? '' : stringValue.replace(variableToDelete, ''));
    },
    [value, onChange, mode],
  );

  const handleCascaderChange = useCallback(
    (next: string[], optionPath: any[]) => {
      if (next[0] === '') {
        onChange?.('');
        return;
      }

      if (next[0] === 'constant') {
        return; // 常量选项被选中，但不改变当前值
      }

      const lastOption = optionPath[optionPath.length - 1];
      if (lastOption?.isLeaf !== false && !lastOption?.children?.length) {
        const stringValue = typeof value === 'string' ? value : value ? String(value) : '';
        const newVariable = `{{ ctx.${next.join('.')} }}`;
        const newValue = mode === 'single' ? newVariable : (stringValue || '') + newVariable;

        // 缓存选项路径中的标签
        const newLabels = new Map<string, string>();
        optionPath.forEach((option, index) => {
          const cacheKey = next.slice(0, index + 1).join('.');
          if (option.label && !labelCache.has(cacheKey)) {
            newLabels.set(cacheKey, option.label);
          }
        });

        if (newLabels.size > 0) {
          setLabelCache((prev) => new Map([...prev, ...newLabels]));
        }

        onChange?.(newValue);
      }
    },
    [value, onChange, mode, labelCache],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (isReadOnlyInSingleMode && e.key !== 'Tab') {
        e.preventDefault();
      }
    },
    [isReadOnlyInSingleMode],
  );

  // 如果启用了 stepInputComponent 且有可用的组件且没有变量，则渲染它
  if (stepInputContent && !hasVariable) {
    return (
      <Space.Compact style={{ display: 'flex', width: '100%', ...style }} className={className}>
        <div
          style={{
            flex: 1,
            borderRadius: `${token.borderRadius}px 0 0 ${token.borderRadius}px`,
            borderTop: `1px solid ${token.colorBorder}`,
            borderBottom: `1px solid ${token.colorBorder}`,
            borderLeft: `1px solid ${token.colorBorder}`,
            display: 'flex',
            alignItems: 'stretch',
          }}
        >
          <div style={{ width: '100%' }}>{stepInputContent}</div>
        </div>

        <Cascader
          options={options}
          onChange={handleCascaderChange}
          changeOnSelect={false}
          disabled={disabled}
          value={cascaderValue}
          expandTrigger="hover"
          loadData={loadData}
        >
          <Button
            type={hasVariable || isConstant ? 'primary' : 'default'}
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
            borderTop: `1px solid ${isFocused ? token.colorPrimary : token.colorBorder}`,
            borderBottom: `1px solid ${isFocused ? token.colorPrimary : token.colorBorder}`,
            borderLeft: `1px solid ${isFocused ? token.colorPrimary : token.colorBorder}`,
            borderRadius: `${token.borderRadius}px 0 0 ${token.borderRadius}px`,
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
            borderTopRightRadius: 0,
            borderBottomRightRadius: 0,
          }}
        />
      )}

      <Cascader
        options={options}
        onChange={handleCascaderChange}
        changeOnSelect={false}
        disabled={disabled}
        value={cascaderValue}
        expandTrigger="hover"
        loadData={loadData}
      >
        <Button
          type={hasVariable || isConstant ? 'primary' : 'default'}
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
