/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { FC, createContext, useCallback, useRef } from 'react';

const NOOP = () => {};

const CollectOperatorsContext = createContext<{
  /** 收集单个字段的操作符 */
  collectOperator: (name: string | number, operator: string) => void;
  /** 获取所有字段的操作符 */
  getOperators: () => Record<string, string>;
  /** 获取单个字段的操作符 */
  getOperator: (name: string | number) => string;
  /** 移除单个字段的操作符 */
  removeOperator: (name: string | number) => void;
}>(null);

export const CollectOperators: FC<{ defaultOperators: Record<string, string> }> = (props) => {
  const operators = useRef(props.defaultOperators || {});

  const collectOperator = useCallback((name: string, operator: string) => {
    operators.current[name] = operator;
  }, []);

  const getOperators = useCallback(() => {
    return { ...operators.current };
  }, []);

  const getOperator = useCallback((name: string) => {
    return operators.current[name];
  }, []);

  const removeOperator = useCallback((name: string) => {
    delete operators.current[name];
  }, []);

  return (
    <CollectOperatorsContext.Provider
      value={{
        collectOperator,
        getOperators,
        getOperator,
        removeOperator,
      }}
    >
      {props.children}
    </CollectOperatorsContext.Provider>
  );
};

export const useOperators = () => {
  const {
    getOperator = NOOP,
    getOperators = NOOP,
    collectOperator = NOOP,
    removeOperator = NOOP,
  } = React.useContext(CollectOperatorsContext) || {};
  return {
    getOperator,
    getOperators: getOperators as () => Record<string, string> | undefined,
    collectOperator,
    removeOperator,
  };
};
