import { Schema } from '@formily/react';

export interface Option {
  key?: string | number;
  value?: string | number;
  label?: React.ReactNode;
  disabled?: boolean;
  children?: Option[];
  // 标记是否为叶子节点，设置了 `loadData` 时有效
  // 设为 `false` 时会强制标记为父节点，即使当前节点没有 children，也会显示展开图标
  isLeaf?: boolean;
  /** 当开启异步加载时有效，用于加载当前 node 的 children */
  loadChildren?(option: Option): void;
  field?: FieldOption;
}

export interface FieldOption {
  name?: string;
  type?: string;
  target?: string;
  title?: string;
  schema?: Schema;
  operators?: Operator[];
  children?: FieldOption[];
}

interface Operator {
  label: string;
  value: string;
}
