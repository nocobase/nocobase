/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useMemo, useCallback, useState, useEffect, useRef } from 'react';
import { Input, Space } from 'antd';
import type { VariableInputProps } from './types';
import { FlowContextSelector } from '../FlowContextSelector';
import { VariableTag } from './VariableTag';
import { isVariableValue } from './utils';
import { createFinalConverters } from './utils';
import { MetaTreeNode } from '../../flowContext';
import { useRequest } from 'ahooks';

const compactStyle = {
  display: 'flex' as const,
  alignItems: 'flex-start' as const,
};

/**
 * 根据路径数组在metaTree中查找对应的MetaTreeNode
 * - 支持在 metaTree 为子树（如去掉了根级 ctx.collection）的情况下，自动裁剪首段进行查找
 */
const findMetaTreeNodeByPath = (metaTree: MetaTreeNode[], targetPath: string[]): MetaTreeNode | null => {
  if (!targetPath || targetPath.length === 0) return null;

  const searchInNodes = (nodes: MetaTreeNode[], path: string[]): MetaTreeNode | null => {
    for (const node of nodes) {
      if (node.paths && arraysEqual(node.paths, path)) {
        return node;
      }
      if (node.paths && isPathPrefix(node.paths, path) && node.children) {
        if (Array.isArray(node.children)) {
          const found = searchInNodes(node.children, path);
          if (found) return found;
        }
      }
    }
    return null;
  };

  // 1) 直接尝试完整路径
  const direct = searchInNodes(metaTree, targetPath);
  if (direct) return direct;

  // 2) 若顶层不包含首段，则裁剪首段重试（兼容子树作为 metaTree 的情况）
  const topNames = new Set((metaTree || []).map((n) => String(n.name)));
  if (!topNames.has(String(targetPath[0]))) {
    const trimmed = targetPath.slice(1);
    if (trimmed.length > 0) {
      return searchInNodes(metaTree, trimmed);
    }
  }

  return null;
};

/**
 * 检查两个数组是否相等
 */
const arraysEqual = (a: string[], b: string[]): boolean => {
  if (a.length !== b.length) return false;
  return a.every((val, index) => val === b[index]);
};

/**
 * 检查pathA是否是pathB的前缀
 * 例如 ["user"] 是 ["user", "profile"] 的前缀
 */
const isPathPrefix = (pathA: string[], pathB: string[]): boolean => {
  if (pathA.length >= pathB.length) return false;
  return pathA.every((val, index) => val === pathB[index]);
};

const VariableInputComponent: React.FC<VariableInputProps> = ({
  value,
  onChange,
  converters: propConverters,
  metaTree,
  showValueComponent = true,
  onlyLeafSelectable = false,
  clearValue,
  ...restProps
}) => {
  const [currentMetaTreeNode, setCurrentMetaTreeNode] = useState<MetaTreeNode | null>(null);
  const lastEmitRef = useRef<{ value: any; path?: string } | null>(null);
  const [innerValue, setInnerValue] = useState<any>(value);
  useEffect(() => {
    setInnerValue(value);
  }, [value]);
  const { resolveValueFromPath, resolvePathFromValue, renderInputComponent } = useMemo(() => {
    return createFinalConverters(propConverters);
  }, [propConverters]);
  const { data: resolvedMetaTree, loading } = useRequest(
    async () => {
      if (typeof metaTree === 'function') {
        const ret = await metaTree();
        if (typeof ret === 'function') {
          return await (ret as unknown as () => any)();
        }
        return ret;
      }
      return metaTree;
    },
    { refreshDeps: [metaTree] },
  );

  const emitChange = useCallback(
    (nextValue: any, meta?: MetaTreeNode) => {
      const nextPath = meta?.paths ? meta.paths.join('.') : undefined;
      const last = lastEmitRef.current;
      if (last && last.value === nextValue && last.path === nextPath) {
        return false;
      }
      lastEmitRef.current = { value: nextValue, path: nextPath };
      onChange?.(nextValue, meta);
      return true;
    },
    [onChange],
  );

  const resolvedMetaTreeNode = useMemo(() => {
    if (currentMetaTreeNode) return currentMetaTreeNode;
    if (Array.isArray(resolvedMetaTree)) {
      const path = resolvePathFromValue?.(innerValue);
      if (path) {
        return findMetaTreeNodeByPath(resolvedMetaTree, path);
      }
    }
    return null;
  }, [currentMetaTreeNode, innerValue, resolvedMetaTree, resolvePathFromValue]);

  // 当 value 存在但 currentMetaTreeNode 还未恢复，尝试按路径逐级加载（支持 children 为函数的场景）
  useEffect(() => {
    const restoreFromValue = async () => {
      if (!Array.isArray(resolvedMetaTree) || !value) return;

      // 若已存在且路径匹配，跳过
      if (currentMetaTreeNode) {
        return;
      }

      const rawPath = resolvePathFromValue?.(value);
      if (!rawPath || rawPath.length === 0) return;

      // 兼容 metaTree 为子树的情况：若顶层无首段，裁剪第一段
      const topNames = new Set(resolvedMetaTree.map((n) => String(n.name)));
      const path = !topNames.has(String(rawPath[0])) ? rawPath.slice(1) : rawPath;
      if (path.length === 0) return;

      // 逐级解析，必要时异步加载 children
      let nodes: MetaTreeNode[] | undefined = resolvedMetaTree;
      let found: MetaTreeNode | null = null;
      for (let i = 0; i < path.length; i++) {
        if (!nodes) {
          found = null;
          break;
        }
        const seg = String(path[i]);
        const node = nodes.find((n) => String(n?.name) === seg);
        if (!node) {
          found = null;
          break;
        }
        found = node;
        if (i < path.length - 1) {
          if (Array.isArray(node.children)) {
            nodes = node.children as any;
          } else if (typeof node.children === 'function') {
            try {
              const childNodes = await (node.children as any)();
              node.children = childNodes;
              nodes = childNodes as any;
            } catch {
              nodes = undefined;
            }
          } else {
            nodes = undefined;
          }
        }
      }

      if (found) {
        setCurrentMetaTreeNode(found);
      }
    };

    restoreFromValue();
  }, [resolvedMetaTree, innerValue, resolvePathFromValue, currentMetaTreeNode]);

  const ValueComponent = useMemo(() => {
    const Component = renderInputComponent?.(resolvedMetaTreeNode);
    const CustomComponent = resolvedMetaTreeNode?.render;
    const finalComponent = isVariableValue(innerValue) ? VariableTag : Component || CustomComponent || Input;
    return finalComponent;
  }, [renderInputComponent, resolvedMetaTreeNode, innerValue]);

  useEffect(() => {
    if (!resolvedMetaTreeNode) return;
    if (!Array.isArray(resolvedMetaTree) || !innerValue) return;
    const finalValue = resolveValueFromPath?.(resolvedMetaTreeNode) || innerValue;
    emitChange(finalValue, resolvedMetaTreeNode);
    setCurrentMetaTreeNode(resolvedMetaTreeNode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedMetaTreeNode]);

  // Track IME composition input
  const composingRef = useRef(false);
  const handleComposition = useCallback(
    (e: React.CompositionEvent<HTMLInputElement> | any) => {
      if (e?.type === 'compositionend') {
        composingRef.current = false;
        // After composition ends, ensure latest value is emitted
        const newValue = e?.target?.value !== undefined ? e.target.value : e;
        setInnerValue(newValue);
        emitChange(newValue);
      } else {
        composingRef.current = true;
      }
    },
    [emitChange],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement> | any) => {
      const newValue = e?.target?.value !== undefined ? e.target.value : e;
      setInnerValue(newValue);
      // If currently composing, defer outer change until compositionend
      const isComposing = composingRef.current || (e?.nativeEvent && (e.nativeEvent as any).isComposing);
      if (isComposing) return;
      emitChange(newValue);
    },
    [emitChange],
  );

  const handleVariableSelect = useCallback(
    (variableValue: string, metaTreeNode?: MetaTreeNode) => {
      setCurrentMetaTreeNode(metaTreeNode);
      const finalValue = resolveValueFromPath?.(metaTreeNode) || variableValue;
      setInnerValue(finalValue);
      emitChange(finalValue, metaTreeNode);
    },
    [emitChange, resolveValueFromPath],
  );

  const { disabled } = restProps;

  const handleClear = useCallback(() => {
    if (disabled) {
      return;
    }
    const cleared = clearValue !== undefined ? clearValue : null;
    setInnerValue(cleared);

    // 若 clearValue 能解析到某个路径（例如 ['constant']），
    // 则尝试立即定位到对应的 MetaTreeNode，以便渲染正确的常量组件。
    try {
      const path = resolvePathFromValue?.(cleared);
      if (Array.isArray(resolvedMetaTree) && path && path.length > 0) {
        const node = findMetaTreeNodeByPath(resolvedMetaTree as MetaTreeNode[], path as string[]);
        if (node) {
          setCurrentMetaTreeNode(node);
          emitChange(cleared as any, node);
          return;
        }
      }
    } catch (_) {
      // 忽略解析异常，走默认回退
    }

    // 默认回退（无法定位具体 MetaTreeNode 时）
    setCurrentMetaTreeNode(null);
    emitChange(cleared as any);
  }, [emitChange, disabled, clearValue, resolvedMetaTree, resolvePathFromValue]);

  const stableProps = useMemo(() => {
    const { style, onFocus, onBlur, disabled, ...otherProps } = restProps;
    return { style, onFocus, onBlur, otherProps };
  }, [restProps]);

  const inputProps = useMemo(() => {
    const baseProps = {
      value: innerValue || '',
      onChange: handleInputChange,
      disabled,
    };

    if (ValueComponent === VariableTag) {
      return {
        ...baseProps,
        onClear: handleClear,
        metaTreeNode: resolvedMetaTreeNode,
        metaTree,
        style: stableProps.style,
      };
    }

    // 避免外部 otherProps 中的 value/onChange 覆盖受控值
    const { value: _ignoredValue, onChange: _ignoredOnChange, ...restOthers } = stableProps.otherProps || {};
    const props = {
      ...baseProps,
      ...restOthers,
      // Ensure IME composition works correctly for text inputs
      onCompositionStart: handleComposition,
      onCompositionUpdate: handleComposition,
      onCompositionEnd: handleComposition,
    };
    return props;
  }, [
    innerValue,
    handleInputChange,
    handleComposition,
    disabled,
    handleClear,
    resolvedMetaTreeNode,
    metaTree,
    ValueComponent,
    stableProps,
  ]);

  const finalStyle = useMemo(
    () => ({
      ...compactStyle,
      ...restProps.style,
    }),
    [restProps.style],
  );

  if (loading) {
    return null;
  }

  return (
    <Space.Compact style={finalStyle}>
      {showValueComponent && (
        <ValueComponent
          // 保证值组件在 Flex 容器中可收缩并占满可用宽度
          style={{ width: '100%', minWidth: 0, ...inputProps['style'] }}
          {...inputProps}
        />
      )}
      <FlowContextSelector
        metaTree={resolvedMetaTree}
        value={innerValue}
        onChange={handleVariableSelect}
        parseValueToPath={resolvePathFromValue}
        formatPathToValue={resolveValueFromPath}
        onlyLeafSelectable={onlyLeafSelectable}
        {...(!showValueComponent && { children: null, placeholder: restProps?.placeholder })}
      />
    </Space.Compact>
  );
};

export const VariableInput = React.memo(VariableInputComponent);
