import React, { useMemo } from 'react';

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
  children: any;
}

export const FlagContext = React.createContext<Omit<FlagProviderProps, 'children'>>(null);

export const FlagProvider = (props: FlagProviderProps) => {
  const value = useMemo(() => {
    return {
      isInAssignFieldValues: props.isInAssignFieldValues,
      isInSetDefaultValueDialog: props.isInSetDefaultValueDialog,
      isInFormDataTemplate: props.isInFormDataTemplate,
    };
  }, [props.isInAssignFieldValues, props.isInFormDataTemplate, props.isInSetDefaultValueDialog]);

  return <FlagContext.Provider value={value}>{props.children}</FlagContext.Provider>;
};
