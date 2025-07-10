/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { createContext, useContext, ReactNode } from 'react';

// StepSettingContext 接口定义
export interface StepSettingContextType {
  // paramsContext 中的信息
  model: any;
  app: any;
  flowEngine: any;
  api: any;
  themeToken: any;
  // 额外的上下文信息
  step: any;
  flow: any;
  flowKey: string;
  stepKey: string;
}

// 创建 Context
const StepSettingContext = createContext<StepSettingContextType | null>(null);

// StepSettingContextProvider 组件
interface StepSettingContextProviderProps {
  children: ReactNode;
  value: StepSettingContextType;
}

export const StepSettingContextProvider: React.FC<StepSettingContextProviderProps> = ({ children, value }) => {
  return <StepSettingContext.Provider value={value}>{children}</StepSettingContext.Provider>;
};

// useStepSettingContext hook
export const useStepSettingContext = (): StepSettingContextType => {
  const context = useContext(StepSettingContext);
  if (!context) {
    throw new Error('useStepSettingContext must be used within a StepSettingContextProvider');
  }
  return context;
};
