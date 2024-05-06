/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Form } from '@formily/core';

export interface DataScopeProps {
  /**
   * 点击提交时触发
   * @param data 配置的 filter 数据
   * @returns void
   */
  onSubmit: (data: { filter: any }) => void;
  /**
   * 数据表名称，用于获取所有的字段选项
   */
  collectionName: string;
  /**
   * 默认的 filter 数据
   */
  defaultFilter: any;
  /**
   * 一个数据表中所有的字段选项
   */
  collectionFilterOption?: any[];
  /**
   * 根据选中的字段类型渲染对应的组件
   * @param props
   * @returns
   */
  dynamicComponent?: (props: any) => React.ReactNode;
  /**
   * 当前表单区块中的表单实例
   */
  form: Form;
  /** 上下文中不需要当前记录 */
  noRecord?: boolean;
}
