import React, { useMemo } from 'react';

export interface FlagProviderProps {
  /**
   * 字段是否存在于 `字段赋值` 弹窗中
   */
  isInAssignFieldValues?: boolean;
  /**
   * 是否存在于 `设置默认值` 弹窗中
   */
  isSetDefaultValueDialog?: boolean;
  children: any;
}

export const FlagContext = React.createContext<Omit<FlagProviderProps, 'children'>>(null);

export const FlagProvider = (props: FlagProviderProps) => {
  const value = useMemo(() => {
    return {
      isInAssignFieldValues: props.isInAssignFieldValues,
      isSetDefaultValueDialog: props.isSetDefaultValueDialog,
    };
  }, [props.isInAssignFieldValues, props.isSetDefaultValueDialog]);

  return <FlagContext.Provider value={value}>{props.children}</FlagContext.Provider>;
};
