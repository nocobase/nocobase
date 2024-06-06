/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Schema } from '@formily/react';
import type { DefaultOptionType } from 'antd/lib/cascader';

export interface Option extends DefaultOptionType {
  key?: string | number;
  value?: string | number;
  label: React.ReactNode;
  disabled?: boolean;
  children?: Option[];
  // 标记是否为叶子节点，设置了 `loadData` 时有效
  // 设为 `false` 时会强制标记为父节点，即使当前节点没有 children，也会显示展开图标
  isLeaf?: boolean;
  /**
   * 当开启异步加载时有效，用于加载当前 node 的 children
   * @param option 需要加载 children 的选项
   * @param activeKey 当前选项所对应的 key
   * @param variablePath 变量路径数组，如 ['$user', 'nickname']
   * @returns
   */
  loadChildren?: (option: Option, activeKey?: string, variablePath?: string[]) => Promise<void>;
  /** 变量中的字段 */
  field?: FieldOption;
  depth?: number;
  deprecated?: boolean;
}

export interface FieldOption {
  name?: string;
  type?: string;
  target?: string;
  title?: string;
  schema?: Schema;
  interface?: string;
  operators?: Operator[];
  children?: FieldOption[];
}

interface Operator {
  label: string;
  value: string;
}
