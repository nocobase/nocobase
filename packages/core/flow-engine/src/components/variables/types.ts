/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { CascaderProps } from 'antd';
import type { MetaTreeNode } from '../../flowContext';

export interface FlowContextSelectorProps
  extends Omit<CascaderProps<any>, 'value' | 'onChange' | 'options' | 'children' | 'multiple'> {
  value?: string;
  onChange?: (value: string, contextSelectorItem?: ContextSelectorItem) => void;
  children?: React.ReactNode;
  metaTree?: MetaTreeNode[] | (() => MetaTreeNode[] | Promise<MetaTreeNode[]>);
  parseValueToPath?: (value: string) => string[] | null;
  formatPathToValue?: (path: string[]) => string;
}

export interface ContextSelectorItem {
  label: string;
  value: string;
  isLeaf?: boolean;
  children?: ContextSelectorItem[];
  loading?: boolean;
  meta?: MetaTreeNode;
  fullPath: string[];
}

export interface Converters {
  /**
   * 根据选中的上下文选择器项目，返回一个用于渲染该值的 React 组件类型。
   * 如果返回 null 或 undefined，则会使用默认的渲染组件。
   * @param contextSelectorItem 选中的 ContextSelectorItem 对象，或者在未选择任何变量时为 null。
   * @returns React.ComponentType<{ value: any; onChange: (value: any) => void; }> | null
   */
  renderInputComponent?: (contextSelectorItem: ContextSelectorItem | null) => React.ComponentType<any> | null;
  /**
   * 将一个外部 value 转换成 FlowContextSelector 需要的路径数组。
   * @param value 外部传入的值。
   * @returns string[] | null
   */
  resolvePathFromValue?: (value: any) => string[] | null;
  /**
   * 当一个上下文节点被选中后，将其信息转换成最终的外部 value。
   * @param contextSelectorItem 选中的 ContextSelectorItem 对象。
   * @param path 选中的路径数组。
   * @returns any
   */
  resolveValueFromPath?: (contextSelectorItem: ContextSelectorItem, path: string[]) => any;
}

export interface VariableInputProps {
  value?: any;
  onChange?: (value: any) => void;
  converters?: Converters | ((contextSelectorItem: ContextSelectorItem | null) => Converters);
  showValueComponent?: boolean;
  [key: string]: any;
}

export interface VariableTagProps {
  value?: string;
  onClear?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export interface InternalState {
  value: any;
  source: 'external' | 'internal';
}
