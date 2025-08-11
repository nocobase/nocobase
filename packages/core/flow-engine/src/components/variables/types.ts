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
  onChange?: (value: string, contextSelectorItem?: ContextSelectorItem) => void;
  children?: CascaderProps<ContextSelectorItem>['children'];
  metaTree?: MetaTreeNode[] | (() => MetaTreeNode[] | Promise<MetaTreeNode[]>);
  parseValueToPath?: (value: string) => string[] | undefined;
  formatPathToValue?: (item: ContextSelectorItem) => string;
  open?: boolean;
}

export interface ContextSelectorItem {
  label: string;
  value: string;
  isLeaf?: boolean;
  children?: ContextSelectorItem[];
  loading?: boolean;
  meta?: MetaTreeNode;
  paths: string[];
}

export interface Converters {
  /**
   * 将一个外部 value 转换成 FlowContextSelector 需要的路径数组。
   * @param value 外部传入的值。
   * @returns string[] | undefined
   */
  resolvePathFromValue?: (value: any) => string[] | undefined;
  /**
   * 当一个上下文节点被选中后，将其信息转换成最终的外部 value。
   * @param contextSelectorItem 选中的 ContextSelectorItem 对象。
   * @returns any
   */
  resolveValueFromPath?: (contextSelectorItem: ContextSelectorItem) => any;
}

export interface VariableInputProps {
  value?: any;
  onChange?: (value: any) => void;
  converters?: Converters;
  showValueComponent?: boolean;
  metaTree?: MetaTreeNode[] | (() => MetaTreeNode[] | Promise<MetaTreeNode[]>);
  [key: string]: any;
}

export interface VariableTagProps {
  value?: string;
  onClear?: () => void;
  className?: string;
  style?: React.CSSProperties;
  contextSelectorItem?: ContextSelectorItem | null;
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
  meta?: ContextSelectorItem;
  children: [{ text: '' }];
}

export interface ParagraphElement {
  type: 'paragraph';
  children: any[];
}
