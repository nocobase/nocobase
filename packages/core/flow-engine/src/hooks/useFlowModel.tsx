/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { createContext, useContext } from 'react';
import { FlowModelContext } from '../flowContext';
import { FlowContextProvider } from '../FlowContextProvider';
import { FlowModel } from '../models';

// 创建 FlowModel 上下文
const FlowModelReactContext = createContext<FlowModel | null>(null);

// FlowModelProvider 组件的 props 类型
export interface FlowModelProviderProps {
  model: FlowModel;
  children: React.ReactNode;
}

/**
 * FlowModelProvider 组件
 * 用于在组件树中提供 FlowModel 实例
 */
export const FlowModelProvider: React.FC<FlowModelProviderProps> = ({ model, children }) => {
  if (!model) {
    throw new Error('FlowModelProvider must be supplied with a model.');
  }
  return (
    <FlowModelReactContext.Provider value={model}>
      <FlowContextProvider context={model.context}>{children}</FlowContextProvider>
    </FlowModelReactContext.Provider>
  );
};

/**
 * useFlowModel Hook
 * 用于从上下文中获取 FlowModel 实例
 *
 * @returns {T} FlowModel 实例
 * @throws {Error} 如果在 FlowModelProvider 外部使用或未提供 model
 */
export function useFlowModel<T extends FlowModel = FlowModel>(): T {
  const model = useContext(FlowModelReactContext);

  if (!model) {
    throw new Error('useFlowModel must be used within a FlowModelProvider');
  }

  return model as T;
}

export function useFlowModelContext<T extends FlowModelContext = FlowModelContext>(): T {
  const model = useFlowModel();
  return model.context as T;
}
