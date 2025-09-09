/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useCallback, useRef, useMemo, useState, useEffect } from 'react';
import { Button, Cascader, Tooltip } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';
import type { ContextSelectorItem, FlowContextSelectorProps } from './variables/types';
import {
  buildContextSelectorItems,
  formatPathToValue,
  parseValueToPath,
  preloadContextSelectorPath,
} from './variables/utils';
import { useResolvedMetaTree } from './variables/useResolvedMetaTree';
import { useFlowContext } from '../FlowContextProvider';

const defaultButtonStyle = {
  fontStyle: 'italic' as const,
  fontFamily: 'New York, Times New Roman, Times, serif',
};

const FlowContextSelectorComponent: React.FC<FlowContextSelectorProps> = ({
  value,
  onChange,
  children,
  metaTree,
  showSearch = false,
  parseValueToPath: customParseValueToPath = parseValueToPath,
  formatPathToValue: customFormatPathToValue,
  open,
  onlyLeafSelectable = false,
  ...cascaderProps
}) => {
  // 记录最后点击的路径，用于双击检测
  const lastSelectedRef = useRef<{ path: string; time: number } | null>(null);

  const { resolvedMetaTree, loading } = useResolvedMetaTree(metaTree);

  // 获取引擎上下文中的翻译函数，若不可用则回退为原文
  const flowCtx = useFlowContext<any>();

  const translateOptions = useCallback(
    (items: ContextSelectorItem[] | undefined): ContextSelectorItem[] => {
      if (!items) return [];
      return items.map((o) => {
        // 计算禁用状态与提示
        const meta = o.meta;
        const disabled = meta ? !!(typeof meta.disabled === 'function' ? meta.disabled() : meta.disabled) : false;
        const disabledReason = meta
          ? ((typeof meta.disabledReason === 'function' ? meta.disabledReason() : meta.disabledReason) as any)
          : undefined;

        // 文本国际化：仅当 label 为字符串时进行翻译
        const baseLabel = typeof o.label === 'string' ? flowCtx.t(o.label) : o.label;

        const label = disabled ? (
          <span>
            {baseLabel}
            <Tooltip
              title={disabledReason || flowCtx.t('This variable is not available')}
              placement="right"
              overlayClassName="flow-variable-disabled-tip"
              destroyTooltipOnHide
            >
              <QuestionCircleOutlined style={{ marginLeft: 6, color: 'rgba(0,0,0,0.35)' }} />
            </Tooltip>
          </span>
        ) : (
          baseLabel
        );

        return {
          ...o,
          label,
          disabled,
          children: Array.isArray(o.children) ? translateOptions(o.children) : o.children,
        };
      });
    },
    [flowCtx],
  );

  // 用于强制重新渲染的状态
  const [updateFlag, setUpdateFlag] = useState(0);
  const triggerUpdate = useCallback(() => setUpdateFlag((prev) => prev + 1), []);

  // 构建选项
  // 注意：rc-cascader 内部对 options 做了基于引用的缓存（useEntities）。
  // 懒加载 children 时我们会原位修改 metaTree；此处依赖 updateFlag 以确保 options 引用变化，
  // 触发 rc-cascader 重新构建 pathKeyEntities，避免二级节点未被索引导致的报错。
  const options = useMemo(() => {
    if (!resolvedMetaTree) return [];
    const base = buildContextSelectorItems(resolvedMetaTree);
    return translateOptions(base);
  }, [resolvedMetaTree, updateFlag, translateOptions]);

  // 内部展开路径：在 onlyLeafSelectable=true 时，点击父节点不会触发 onChange，
  // 但会触发 loadData。我们在此记录路径以在懒加载后保持展开。
  const [tempSelectedPath, setTempSelectedPath] = useState<string[]>([]);

  // 处理异步加载子节点
  const handleLoadData = useCallback(
    async (selectedOptions: ContextSelectorItem[]) => {
      const targetOption = selectedOptions[selectedOptions.length - 1];
      if (!targetOption || targetOption.children || targetOption.isLeaf) {
        return;
      }

      const targetMetaNode = targetOption.meta;
      if (!targetMetaNode || !targetMetaNode.children || typeof targetMetaNode.children !== 'function') {
        return;
      }

      try {
        // 记录当前点击的路径，保证 options 重建后仍能维持展开并展示子级
        setTempSelectedPath(selectedOptions.map((o) => String(o.value)));
        targetOption.loading = true;
        triggerUpdate();
        const childNodes = await targetMetaNode.children();
        targetMetaNode.children = childNodes;
        // 立即把 options 树也补上 children，避免等待下一次重算
        const childOptions = translateOptions(buildContextSelectorItems(childNodes));
        targetOption.children = childOptions;
        targetOption.isLeaf = !childOptions || childOptions.length === 0;
      } catch (error) {
        console.error('Failed to load children:', error);
      } finally {
        targetOption.loading = false;
        triggerUpdate();
      }
    },
    [triggerUpdate],
  );

  const currentPath = useMemo(() => {
    return customParseValueToPath(value);
  }, [value, customParseValueToPath]);

  // 当 metaTree 为子层（如 getPropertyMetaTree('{{ ctx.collection }}') 返回的是 collection 的子节点）
  // 而 value path 仍包含根键（如 ['collection', 'field']）时，自动丢弃不存在的首段，确保级联能正确对齐。
  const effectivePath = useMemo(() => {
    if (!currentPath || currentPath.length === 0) return currentPath;
    const topValues = new Set(options.map((o) => String(o.value)));
    const needTrim = !topValues.has(String(currentPath[0]));
    const fixed = needTrim ? currentPath.slice(1) : currentPath;
    return fixed;
  }, [currentPath, options]);

  // 预加载：当存在有效路径时，按路径逐级加载 children，保证默认展开和选中路径可用
  const pathToPreload = useMemo(() => {
    const finalPath = effectivePath && effectivePath.length > 0 ? effectivePath : tempSelectedPath;
    return Array.isArray(finalPath) ? finalPath : [];
  }, [effectivePath, tempSelectedPath]);

  useEffect(() => {
    if (pathToPreload.length === 0 || !options?.length) return;
    preloadContextSelectorPath(options, pathToPreload, triggerUpdate);
  }, [options, pathToPreload, triggerUpdate]);

  // 默认按钮组件
  const defaultChildren = useMemo(() => {
    const hasSelected = currentPath && currentPath.length > 0;
    return (
      <Button type={hasSelected ? 'primary' : 'default'} style={defaultButtonStyle}>
        x
      </Button>
    );
  }, [currentPath]);

  // 处理选择变化事件
  const handleChange = useCallback(
    (selectedValues: (string | number)[], selectedOptions?: ContextSelectorItem[]) => {
      const lastOption = selectedOptions?.[selectedOptions.length - 1];
      if (!selectedValues || selectedValues.length === 0) {
        onChange?.('', lastOption?.meta);
        setTempSelectedPath([]);
        return;
      }

      const path = selectedValues.map(String);
      const pathString = path.join('.');
      const isLeaf = lastOption?.isLeaf;
      const now = Date.now();

      // 使用自定义格式化函数或默认函数
      let formattedValue: string;
      if (customFormatPathToValue) {
        formattedValue = customFormatPathToValue(lastOption?.meta);
        if (formattedValue === undefined) {
          formattedValue = formatPathToValue(lastOption?.meta);
        }
      } else {
        formattedValue = formatPathToValue(lastOption?.meta);
      }

      if (isLeaf) {
        onChange?.(formattedValue, lastOption?.meta);
        // 选中叶子节点后，可清空内部临时路径（外部 value 将驱动级联）
        setTempSelectedPath([]);
        return;
      }

      // 非叶子节点：检查双击
      const lastSelected = lastSelectedRef.current;
      const isDoubleClick = !onlyLeafSelectable && lastSelected?.path === pathString && now - lastSelected.time < 300;

      if (isDoubleClick) {
        // 双击：选中非叶子节点
        onChange?.(formattedValue, lastOption?.meta);
        lastSelectedRef.current = null;
      } else {
        // 单击：记录状态，仅展开
        lastSelectedRef.current = { path: pathString, time: now };
        // 同时记录内部路径，保证懒加载后 options 重建也能维持展开
        setTempSelectedPath(path);
      }
    },
    [onChange, customFormatPathToValue, onlyLeafSelectable],
  );

  return (
    <Cascader
      {...cascaderProps}
      options={options}
      value={tempSelectedPath && tempSelectedPath.length > 0 ? tempSelectedPath : effectivePath}
      onChange={handleChange}
      loadData={handleLoadData}
      loading={loading}
      changeOnSelect={!onlyLeafSelectable}
      expandTrigger="click"
      open={open}
      showSearch={children === null}
    >
      {children === null ? null : children || defaultChildren}
    </Cascader>
  );
};

export const FlowContextSelector = React.memo(FlowContextSelectorComponent);
