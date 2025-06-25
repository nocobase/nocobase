/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { FC } from 'react';

export interface FlagProviderProps {
  /**
   * 字段是否存在于 `字段赋值` 弹窗中
   */
  isInAssignFieldValues?: boolean;
  /**
   * 是否存在于 `设置默认值` 弹窗中
   */
  isInSetDefaultValueDialog?: boolean;
  /**
   * 是否存在于 `表单数据模板` 中
   */
  isInFormDataTemplate?: boolean;
  /**
   * 是否存在于 `子表格` 中
   */
  isInSubTable?: boolean;
  /**
   * 是否存在于 `子表单` 中
   */
  isInSubForm?: boolean;
  /**
   * 如果为 true，则表示变量需要在其他上下文中解析
   * @default true
   */
  isVariableParsedInOtherContext?: boolean;
  collectionField?: any; //目标赋值的数据表字段
  children?: any;

  /**
   * 是否存在于 `筛选表单区块` 中
   */
  isInFilterFormBlock?: boolean;
}

export const FlagContext = React.createContext<Omit<FlagProviderProps, 'children'>>(null);

export const FlagProvider: FC<FlagProviderProps> = (props) => {
  return <FlagContext.Provider value={props}>{props.children}</FlagContext.Provider>;
};
