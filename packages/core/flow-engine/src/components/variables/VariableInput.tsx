/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useState, useEffect, useMemo, useCallback, useRef, useLayoutEffect } from 'react';
import { Input, Space } from 'antd';
import { CloseCircleFilled } from '@ant-design/icons';
import { css, cx } from '@emotion/css';
import type { VariableInputProps, Converters } from './types';
import type { MetaTreeNode } from '../../flowContext';
import { FlowContextSelector } from '../FlowContextSelector';
import { VariableTag } from './VariableTag';
import { createDefaultConverters, isVariableValue, parseValueToPath } from './utils';

export const VariableInput: React.FC<VariableInputProps> = ({
  value,
  onChange,
  converters: propConverters,
  metaTree,
  ...restProps
}) => {
  // 输入框引用，用于保持焦点
  const inputRef = useRef<any>(null);
  // 跟踪输入框是否有焦点
  const [hasFocus, setHasFocus] = useState(false);
  // 上一个值的引用，用于检测值变化
  const prevValueRef = useRef(value);

  const currentValue = value;

  const currentMeta = useMemo(() => {
    if (!isVariableValue(currentValue)) return null;

    const path = parseValueToPath(currentValue);
    if (!path || path.length === 0) return null;

    // 返回基本的 meta 对象
    return {
      name: path[path.length - 1],
      title: path[path.length - 1],
      type: 'string',
    } as MetaTreeNode;
  }, [currentValue]);

  // 使用ref存储最新的props和状态，避免闭包问题
  const propsRef = useRef({ propConverters, currentMeta });

  // 根据路径和metaTree获取显示用的标题路径
  const getDisplayPath = useCallback(
    (path: string[]): string => {
      const buildPathTitles = (tree: MetaTreeNode[], currentPath: string[], depth = 0): string[] => {
        if (depth >= currentPath.length || !tree) return [];

        const segment = currentPath[depth];
        const node = tree.find((n) => n.name === segment);

        if (!node) return [segment]; // 回退到name

        const currentTitle = node.title || node.name;

        if (depth === currentPath.length - 1) {
          return [currentTitle];
        }

        // 递归处理子节点
        if (Array.isArray(node.children)) {
          const childTitles = buildPathTitles(node.children, currentPath, depth + 1);
          return [currentTitle, ...childTitles];
        }

        // 如果没有子节点信息，回退到使用name
        return [currentTitle, ...currentPath.slice(depth + 1)];
      };

      if (!metaTree || typeof metaTree === 'function') {
        return path.join('/'); // 回退到使用name
      }

      const titles = buildPathTitles(metaTree, path);
      return titles.join('/');
    },
    [metaTree],
  );

  // 更新ref中的最新值
  propsRef.current = { propConverters, currentMeta };

  // 焦点管理 - 在值变化时保持焦点
  useLayoutEffect(() => {
    const valueChanged = prevValueRef.current !== value;
    prevValueRef.current = value;

    // 如果值变化了且之前有焦点，需要恢复焦点
    if (valueChanged && hasFocus && inputRef.current) {
      // 使用setTimeout确保DOM已经更新
      setTimeout(() => {
        if (inputRef.current && document.activeElement !== inputRef.current) {
          inputRef.current.focus();
        }
      }, 0);
    }
  }, [value, hasFocus]);

  // 创建完全稳定的输入组件 - 只在必要时重新创建
  const StableInputComponent = useMemo(() => {
    // 动态计算转换器
    const defaultConverters = createDefaultConverters();
    let currentConverters: Converters;

    if (!propConverters) {
      currentConverters = defaultConverters;
    } else if (typeof propConverters === 'function') {
      const dynamicConverters = propConverters(currentMeta);
      currentConverters = { ...defaultConverters, ...dynamicConverters };
    } else {
      currentConverters = { ...defaultConverters, ...propConverters };
    }

    // 获取自定义组件或使用默认Input
    const CustomComponent = currentConverters.renderInputComponent?.(null);

    // 如果有自定义组件，使用自定义组件；否则使用Input
    if (CustomComponent && typeof CustomComponent === 'function') {
      // 使用 React.forwardRef 包装自定义组件以支持 ref
      return React.forwardRef<any, any>((props, ref) => React.createElement(CustomComponent, { ...props, ref }));
    }

    // 默认使用Input组件（已经支持 forwardRef）
    return Input;
  }, [propConverters, currentMeta]); // 只有这些真正影响组件类型的变化时才重新创建

  const handleInputChange = useCallback(
    (newValue: any) => {
      onChange?.(newValue);
    },
    [onChange],
  );

  const handleVariableSelect = useCallback(
    (variableValue: string) => {
      const path = parseValueToPath(variableValue);

      // 动态计算转换器
      const { propConverters: currentPropConverters, currentMeta: currentCurrentMeta } = propsRef.current;
      const defaultConverters = createDefaultConverters();
      let currentConverters: Converters;

      if (!currentPropConverters) {
        currentConverters = defaultConverters;
      } else if (typeof currentPropConverters === 'function') {
        const dynamicConverters = currentPropConverters(currentCurrentMeta);
        currentConverters = { ...defaultConverters, ...dynamicConverters };
      } else {
        currentConverters = { ...defaultConverters, ...currentPropConverters };
      }

      const finalValue = currentConverters.resolveValueFromPath?.(currentCurrentMeta, path || []) || variableValue;

      onChange?.(finalValue);
    },
    [onChange],
  );

  const handleClear = useCallback(() => {
    // 清除时，调用 onChange(null)
    onChange?.(null);
  }, [onChange]);

  // 创建稳定的事件处理器
  const stableOnChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement> | any) => {
      const newValue = e?.target?.value !== undefined ? e.target.value : e;
      handleInputChange(newValue);
    },
    [handleInputChange],
  );

  const stableOnFocus = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      setHasFocus(true);
      // 调用原始的onFocus处理器（如果存在）
      if (restProps.onFocus) {
        restProps.onFocus(e);
      }
    },
    [restProps],
  );

  const stableOnBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      setHasFocus(false);
      // 调用原始的onBlur处理器（如果存在）
      if (restProps.onBlur) {
        restProps.onBlur(e);
      }
    },
    [restProps],
  );

  // 创建稳定的 props 对象 - 只在必要时重新创建
  const inputProps = useMemo(() => {
    const { style, ...otherProps } = restProps; // 排除 style，它应该应用到最外层容器
    return {
      ...otherProps,
      value: currentValue || '',
      onChange: stableOnChange,
      onFocus: stableOnFocus,
      onBlur: stableOnBlur,
      ref: inputRef,
      style: {
        flex: 1, // 确保在Space.Compact中占用应有的空间
      },
    };
  }, [currentValue, stableOnChange, stableOnFocus, stableOnBlur, restProps]);

  // 对于变量值，始终使用 VariableTag，无论转换器如何
  if (isVariableValue(currentValue)) {
    const path = parseValueToPath(currentValue);
    const displayValue = path ? getDisplayPath(path) : String(currentValue);
    const disabled = inputProps.disabled;

    return (
      <Space.Compact style={{ display: 'flex', alignItems: 'center', ...restProps.style }}>
        <div
          className={cx(
            'variable',
            css`
              position: relative;
              line-height: 0;
              flex: 1; /* 参与flex拉伸，与静态值模式保持一致 */

              &:hover {
                .clear-button {
                  display: inline-block;
                }
              }

              .ant-input {
                overflow: auto;
                white-space: nowrap;
                ${disabled ? '' : 'padding-right: 28px;'}

                .ant-tag {
                  display: inline;
                  line-height: 19px;
                  margin: 0;
                  padding: 2px 7px;
                  border-radius: 10px;
                }
              }

              .variable-input-container {
                &:hover {
                  border-color: #4096ff !important;
                }

                &:focus-within {
                  border-color: #4096ff !important;
                  outline: 0;
                  box-shadow: 0 0 0 2px rgba(5, 145, 255, 0.1);
                }
              }

              .clear-button {
                position: absolute;
                top: 50%;
                right: 8px;
                transform: translateY(-50%);
                color: #bfbfbf;
                cursor: pointer;
                display: none;
                z-index: 1;

                &:hover {
                  color: #999;
                }
              }
            `,
          )}
        >
          <div
            role="button"
            aria-label="variable-tag"
            style={{
              overflow: 'hidden',
              display: 'flex', // 改为 flex，填充父容器宽度
              alignItems: 'center',
              minHeight: '32px',
              padding: 0, // 移除padding，让tag直接控制间距
              border: '1px solid #d9d9d9',
              borderRadius: '6px',
              backgroundColor: '#ffffff',
              boxSizing: 'border-box',
              transition: 'border-color 0.2s',
              width: '100%', // 填充父容器宽度
              ...(disabled
                ? {
                    backgroundColor: '#f5f5f5',
                    borderColor: '#d9d9d9',
                    cursor: 'not-allowed',
                  }
                : {}),
            }}
            className={cx('variable-input-container', { 'ant-input-disabled': disabled })}
          >
            <VariableTag
              value={displayValue}
              onClear={undefined} // 不使用tag自带的close按钮
              className=""
              style={{
                margin: '4px 6px', // 在tag上设置margin而不是容器padding
              }}
            />
          </div>
          {!disabled ? (
            <span
              role="button"
              aria-label="close"
              className={cx('clear-button')}
              style={{ userSelect: 'none' }}
              onClick={handleClear}
            >
              <CloseCircleFilled />
            </span>
          ) : null}
        </div>
        <FlowContextSelector metaTree={metaTree} value={currentValue} onChange={handleVariableSelect} />
      </Space.Compact>
    );
  }

  // 对于静态值，使用转换器或回退到 Input
  return (
    <Space.Compact style={{ display: 'flex', alignItems: 'center', ...restProps.style }}>
      <StableInputComponent {...inputProps} />
      <FlowContextSelector metaTree={metaTree} onChange={handleVariableSelect} />
    </Space.Compact>
  );
};
