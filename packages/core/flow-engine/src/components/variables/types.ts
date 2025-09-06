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
  extends Omit<CascaderProps<ContextSelectorItem>, 'value' | 'onChange' | 'options' | 'children' | 'multiple'> {
  value?: string;
  onChange?: (value: string, metaTreeNode?: MetaTreeNode) => void;
  children?: CascaderProps<ContextSelectorItem>['children'];
  metaTree?: MetaTreeNode[] | (() => MetaTreeNode[] | Promise<MetaTreeNode[]>);
  parseValueToPath?: (value: string) => string[] | undefined;
  formatPathToValue?: (item: MetaTreeNode) => string;
  open?: boolean;
  onlyLeafSelectable?: boolean;
}

export interface ContextSelectorItem {
  label: React.ReactNode;
  value: string;
  isLeaf?: boolean;
  children?: ContextSelectorItem[];
  loading?: boolean;
  meta?: MetaTreeNode;
  paths: string[];
  disabled?: boolean;
}

export interface Converters {
  /**
   * 根据选中的上下文选择器项目，返回一个用于渲染该值的 React 组件类型。
   * 如果返回 null 或 undefined，则会使用默认的渲染组件。
   * @param metaTreeNode 选中的 MetaTreeNode 对象，或者在未选择任何变量时为 null。
   * @returns React.ComponentType<{ value: any; onChange: (value: any) => void; }> | null
   */
  renderInputComponent?: (metaTreeNode: MetaTreeNode | null) => React.ComponentType<any> | null;

  /**
   * 将一个外部 value 转换成 FlowContextSelector 需要的路径数组。
   * @param value 外部传入的值。
   * @returns string[] | undefined
   */
  resolvePathFromValue?: (value: any) => string[] | undefined;
  /**
   * 当一个上下文节点被选中后，将其信息转换成最终的外部 value。
   * @param metaTreeNode 选中的 MetaTreeNode 对象。
   * @returns any
   */
  resolveValueFromPath?: (metaTreeNode: MetaTreeNode) => any;
}

export interface VariableInputProps {
  value?: any;
  onChange?: (value: any, contextMeta?: MetaTreeNode) => void;
  converters?: Converters;
  showValueComponent?: boolean;
  metaTree?: MetaTreeNode[] | (() => MetaTreeNode[] | Promise<MetaTreeNode[]>);
  onlyLeafSelectable?: boolean;
  [key: string]: any;
}

export interface VariableTagProps {
  value?: string;
  onClear?: () => void;
  className?: string;
  style?: React.CSSProperties;
  metaTreeNode?: MetaTreeNode | null;
  metaTree?: MetaTreeNode[] | (() => MetaTreeNode[] | Promise<MetaTreeNode[]>);
}

export interface VariableTriggerElement {
  type: 'variable-trigger';
  triggerId: string;
  children: [{ text: '' }];
}

export interface VariableElement {
  type: 'variable';
  value: string;
  meta?: MetaTreeNode;
  children: [{ text: '' }];
}

export interface ParagraphElement {
  type: 'paragraph';
  children: any[];
}
