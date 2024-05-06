/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useContext } from 'react';
import { DeclareVariableContext } from './DeclareVariable';

/**
 * 获取对应标识符的变量值，及其它信息
 * @param variableName
 * @returns
 */
export const useVariable = (variableName: string) => {
  const { name, value, title, collection } = useContext(DeclareVariableContext) || {};
  if (name === variableName) {
    return { value, title, collection };
  }
  return {};
};
