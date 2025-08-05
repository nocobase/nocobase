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
  onChange?: (value: string) => void;
  children?: React.ReactNode;
  metaTree?: MetaTreeNode[] | (() => MetaTreeNode[] | Promise<MetaTreeNode[]>);
}

export interface CascaderOption {
  label: string;
  value: string;
  isLeaf?: boolean;
  children?: CascaderOption[];
  loading?: boolean;
  meta?: MetaTreeNode;
  fullPath?: string[]; // 用于搜索结果显示完整路径
}

export interface Converters {
  /**
   * 根据选中的 meta 节点，返回一个用于渲染该值的 React 组件类型。
   * 如果返回 null 或 undefined，则会使用默认的渲染组件。
   * @param meta 选中的 MetaTreeNode 对象，或者在未选择任何变量时为 null。
   * @returns React.ComponentType<{ value: any; onChange: (value: any) => void; }> | null
   */
  renderInputComponent?: (meta: MetaTreeNode | null) => React.ComponentType<any> | null;
  /**
   * 将一个外部 value 转换成 FlowContextSelector 需要的路径数组。
   * @param value 外部传入的值。
   * @returns string[] | null
   */
  resolvePathFromValue?: (value: any) => string[] | null;
  /**
   * 当一个上下文节点被选中后，将其 meta 信息转换成最终的外部 value。
   * @param meta 选中的 MetaTreeNode 对象。
   * @param path 选中的路径数组。
   * @returns any
   */
  resolveValueFromPath?: (meta: MetaTreeNode, path: string[]) => any;
}

export interface VariableInputProps {
  value?: any;
  onChange?: (value: any) => void;
  converters?: Converters | ((meta: MetaTreeNode | null) => Converters);
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
