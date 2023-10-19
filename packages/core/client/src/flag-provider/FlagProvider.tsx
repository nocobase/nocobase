import React from 'react';

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
  children: any;
}

export const FlagContext = React.createContext<Omit<FlagProviderProps, 'children'>>(null);

export const FlagProvider = (props: FlagProviderProps) => {
  return <FlagContext.Provider value={props}>{props.children}</FlagContext.Provider>;
};
