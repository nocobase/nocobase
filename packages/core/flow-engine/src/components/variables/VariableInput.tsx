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

// 提取变量路径的辅助函数
const extractVariablePaths = (value: string): string[][] => {
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
    if (!value || !metaTreeCache.has('root')) return;

    const variablePaths = extractVariablePaths(value);
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

  // 检查是否是 EditableFieldModel 或其子类
  const isEditableFieldModel = useCallback((model: any) => {
    if (!model?.flowEngine) return false;

    const EditableFieldModelClass = model.flowEngine.getModelClass('EditableFieldModel');
    if (!EditableFieldModelClass) return false;

    return model instanceof EditableFieldModelClass;
  }, []);

  // 获取model组件配置
  const modelComponent = useMemo(() => {
    const shouldRender = renderFromModel ?? isEditableFieldModel(flowContext.model);
    if (!shouldRender || !flowContext.model['component']) return null;

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
  }, [renderFromModel, isEditableFieldModel, flowContext.model, value, onChange, placeholder, disabled]);

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
    if (!value) return { displayParts: [], hasVariable: false, isConstant: false, cascaderValue: [''] };

    const parts: Array<{ type: 'text' | 'variable'; content: string; labels?: string[] }> = [];
    let lastIndex = 0;
    let foundVariable = false;

    VARIABLE_REGEX.lastIndex = 0;
    let match;
    while ((match = VARIABLE_REGEX.exec(value)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ type: 'text', content: value.slice(lastIndex, match.index) });
      }

      const variablePath = parseVariablePath(match[1]);
      const labels = getVariableLabels(variablePath);
      parts.push({ type: 'variable', content: match[0], labels });
      foundVariable = true;

      lastIndex = VARIABLE_REGEX.lastIndex;
    }

    if (lastIndex < value.length) {
      parts.push({ type: 'text', content: value.slice(lastIndex) });
    }

    // 计算 cascaderValue
    const isConstant = value && !foundVariable;
    let cascaderValue = [''];

    if (foundVariable) {
      const regex = mode === 'single' ? /^\{\{\s*ctx\.([^}]+?)\s*\}\}$/ : VARIABLE_REGEX;
      const varMatch = value.match(regex);
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
        return;
      }

      if (next[0] === 'constant') {
        return; // 常量选项被选中，但不改变当前值
      }

      const lastOption = optionPath[optionPath.length - 1];
      if (lastOption?.isLeaf !== false && !lastOption?.children?.length) {
        const newVariable = `{{ ctx.${next.join('.')} }}`;
        const newValue = mode === 'single' ? newVariable : (value || '') + newVariable;

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

  // 如果启用了 model 渲染且有可用的组件，则渲染它
  if (modelComponent && !hasVariable) {
    const { Component, props } = modelComponent;

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
          <Component {...props} />
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
