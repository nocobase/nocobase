/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { Cascader, Button, theme, Dropdown } from 'antd';
import { useFlowSettingsContext } from '../../hooks';
import { MetaTreeNode } from '../../flowContext';
import { useTranslation } from 'react-i18next';

interface VariableSelectorProps {
  /** 当前选中的值 */
  value?: string[];
  /** 选择变化回调 */
  onChange?: (value: string[], optionPath?: any[]) => void;
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否显示为primary类型 */
  isPrimary?: boolean;
  /** 按钮样式 */
  buttonStyle?: React.CSSProperties;
  /** 按钮内容 */
  buttonContent?: React.ReactNode;
  /** 级联选择器的其他props */
  cascaderProps?: any;
  /** 自定义变量元数据树，支持函数形式 */
  propertyMetaTree?: MetaTreeNode[] | (() => Promise<MetaTreeNode[]>);
}

interface CascaderOption {
  value: string;
  label: string;
  children?: CascaderOption[];
  // 添加路径信息，用于追踪被flatten的节点
  fullPath?: string[];
  originalPath?: string[];
  // 用于标识是否为叶子节点
  isLeaf?: boolean;
  // 父级选项路径
  parentPath?: string[];
  // 路径字符串
  pathString?: string;
}

const convertMetaTreeToCascaderData = (
  nodes: MetaTreeNode[],
  t: (key: string) => string,
  parentPath: string[] = [],
): CascaderOption[] => {
  const result: CascaderOption[] = [];

  for (const node of nodes) {
    const meta = node as any;
    const currentPath = [...parentPath, node.name];

    // 根据 display 属性处理显示逻辑
    if (meta.display === 'none') {
      // 完全隐藏，跳过该节点和子节点
      continue;
    }

    if (meta.display === 'flatten') {
      // 隐藏当前层级，但将子节点平铺到当前级别，并保留路径信息
      if (node.children) {
        if (typeof node.children === 'function') {
          // 异步函数暂时跳过，需要在动态加载时处理
          continue;
        } else {
          // 递归处理子节点并平铺到当前级别，传递当前路径
          const flattenedChildren = convertMetaTreeToCascaderData(node.children, t, currentPath);
          result.push(...flattenedChildren);
        }
      }
      continue;
    }

    // 默认处理（display === 'default' 或 undefined）
    result.push({
      value: node.name,
      label: t(node.title || node.name),
      fullPath: currentPath, // 完整路径，包含被flatten的节点
      originalPath: [node.name], // 原始选择路径
      parentPath: parentPath, // 父级路径
      children: node.children
        ? typeof node.children === 'function'
          ? [] // 异步函数，留空待加载
          : convertMetaTreeToCascaderData(node.children, t, currentPath) // 递归处理子节点
        : undefined,
      isLeaf: !node.children,
      // 添加自定义属性用于标识路径
      pathString: currentPath.join('.'),
    });
  }

  return result;
};

/**
 * 变量选择器组件
 *
 * 提供变量选择功能，包括 null、constant 和动态变量选项
 */
export const VariableSelector: React.FC<VariableSelectorProps> = ({
  value = [''],
  onChange,
  disabled = false,
  isPrimary = false,
  buttonStyle,
  buttonContent = 'x',
  cascaderProps,
  propertyMetaTree,
}) => {
  const { t } = useTranslation();
  const { token } = theme.useToken();
  const flowContext = useFlowSettingsContext();

  const [cascaderData, setCascaderData] = useState<CascaderOption[]>([]);
  const [metaTreeCache, setMetaTreeCache] = useState<Map<string, MetaTreeNode[]>>(new Map());
  const cascaderRef = useRef<any>(null);

  // 初始化数据
  useEffect(() => {
    const initializeMetaTree = async () => {
      try {
        let metaTree: MetaTreeNode[];

        if (propertyMetaTree) {
          // 使用自定义的 propertyMetaTree
          if (typeof propertyMetaTree === 'function') {
            metaTree = await (propertyMetaTree as () => Promise<MetaTreeNode[]>)();
          } else {
            metaTree = propertyMetaTree;
          }
        } else {
          // 使用 flowContext 的默认 propertyMetaTree
          metaTree = flowContext.getPropertyMetaTree();
        }

        const cascaderOptions = convertMetaTreeToCascaderData(metaTree, flowContext.t);
        setCascaderData(cascaderOptions);

        // 缓存根级别的MetaTreeNode
        setMetaTreeCache(new Map([['root', metaTree]]));
      } catch (error) {
        console.error('Failed to get property meta tree:', error);
        setCascaderData([]);
      }
    };

    initializeMetaTree();
  }, [flowContext, propertyMetaTree]);

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
          const childOptions = convertMetaTreeToCascaderData(childNodes, flowContext.t, path);

          // 缓存子节点
          const newCache = new Map(metaTreeCache);
          newCache.set(pathKey, childNodes);
          setMetaTreeCache(newCache);

          // 更新cascader选项，添加parentPath
          targetOption.children = childOptions.map((option) => ({
            ...option,
            parentPath: path,
          }));
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

  const handleChange = useCallback(
    (next: string[], optionPath: any[]) => {
      // 重建完整路径，考虑被flatten的节点
      let fullPath = next;

      if (optionPath && optionPath.length > 0) {
        // 获取最后一个选项的完整路径
        const lastOption = optionPath[optionPath.length - 1];
        if (lastOption && lastOption.fullPath && lastOption.fullPath.length > 0) {
          // 确保路径中没有undefined值，并过滤掉空值
          fullPath = lastOption.fullPath.filter((segment) => segment != null && segment !== '');
        }
      }

      // 确保fullPath不包含undefined值
      fullPath = fullPath.filter((segment) => segment != null && segment !== '');

      onChange?.(fullPath, optionPath);
    },
    [onChange],
  );

  // 自定义下拉菜单
  const customDropdownRender = useCallback((menus: React.ReactNode) => {
    return <div>{menus}</div>;
  }, []);

  // 自定义选项渲染
  const handleDisplayRender = useCallback((labels: string[], selectedOptions: CascaderOption[]) => {
    return <span>{labels[labels.length - 1]}</span>;
  }, []);

  return (
    <Cascader
      ref={cascaderRef}
      options={options}
      onChange={handleChange}
      changeOnSelect={true}
      disabled={disabled}
      value={value}
      expandTrigger="hover"
      loadData={loadData}
      dropdownRender={customDropdownRender}
      fieldNames={{ label: 'label', value: 'value', children: 'children' }}
      displayRender={handleDisplayRender}
      {...cascaderProps}
    >
      <Button type={isPrimary ? 'primary' : 'default'} disabled={disabled} style={buttonStyle}>
        {buttonContent}
      </Button>
    </Cascader>
  );
};
