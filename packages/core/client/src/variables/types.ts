/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Dispatch, SetStateAction } from 'react';
import { CollectionFieldOptions_deprecated } from '../collection-manager';

export interface VariablesContextType {
  /**
   * 解析变量所需的上下文数据
   *
   * ```ts
   * const ctx = {
   *  $user: {
   *   id: 1,
   *   name: 'test',
   *  }
   * }
   * ```
   */
  ctxRef: React.MutableRefObject<Record<string, any>>;
  /**
   * 更新上下文
   */
  setCtx: Dispatch<SetStateAction<Record<string, any>>>;
  /**
   * 解析变量
   * @param str 一个变量字符串，例如：`{{ $user.name }}`
   * @returns 变量解析后的值
   *
   * ```ts
   * const { value } = await parseVariable('{{ $user.name }}');
   * console.log(value); // test
   * ```
   */
  parseVariable: (
    str: string,
    localVariable?: VariableOption | VariableOption[],
    options?: {
      /** 第一次请求时，需要包含的关系字段 */
      appends?: string[];
      /** do not request when the association field is empty */
      doNotRequest?: boolean;
      /**
       * The operator related to the current field, provided when parsing the default value of the field
       */
      fieldOperator?: string | void;
    },
  ) => Promise<{
    value: any;
    /**
     * 当前变量所对应的数据表的名称，如果为空，则表示当前变量是一个普通类型的变量（字符串、数字等）
     */
    collectionName?: string;
    dataSource?: string;
  }>;
  /**
   * 注册变量
   * @param variableOption 新变量的配置
   * @returns void
   *
   * ```ts
   * registerVariable({
   *  name: '$user',
   *  collectionName: 'users',
   *  ctx: {
   *    id: 1,
   *    name: 'test',
   *  },
   * });
   * ```
   */
  registerVariable: (variableOption: VariableOption) => void;
  /**
   * 获取变量的配置
   * @param variableName 变量的名称，例如：`$user`
   * @returns 变量的配置
   */
  getVariable: (variableName: string) => VariableOption;
  getCollectionField: (
    variableString: string,
    localVariables?: VariableOption | VariableOption[],
  ) => Promise<CollectionFieldOptions_deprecated>;
  removeVariable: (variableName: string) => void;
  filterVariables?: (params) => boolean; //自定义过滤变量
}

export interface VariableOption {
  /** 变量的表示，例如：`$user` */
  name: string;
  /** 变量的值 */
  ctx: {
    id?: number | string;
    [key: string]: any;
  };
  /** 变量所对应的数据表的名称 */
  collectionName?: string;
  /** 数据表所对应的数据源 */
  dataSource?: string;
  /**
   * @default null
   * 表示当变量解析出来的值是一个 undefined 时，最终应该返回的值。
   * 默认是 null，这样可以保证数据范围中的 filter 条件不会被清除掉，
   * 如果想让数据范围中的 filter 条件被清除掉，可以设置 defaultValue 为 undefined。
   */
  defaultValue?: any;
}
