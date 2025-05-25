/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { createContext, useContext, ReactNode, useRef, useCallback } from "react";

export const BlockConfigsContext = createContext<{
  getConfigs: () => any;
  setConfigs: (value: any, shouldNotify?: boolean) => void;
  getFiltersConfigs: () => any;
  getEventsConfigs: () => any;
  subscribe: (callback: () => void) => () => void;
}>({
  getConfigs: () => null,
  setConfigs: () => {},
  getFiltersConfigs: () => ({}),
  getEventsConfigs: () => ({}),
  subscribe: () => () => {},
});

// 提供一个自定义 Hook 用于访问 BlockConfigs 上下文
export const useBlockConfigs = () => {
  return useContext(BlockConfigsContext);
};

export const BlockConfigsProvider = ({ children, value: initialValue }: { children: ReactNode; value: any }) => {
  const valueRef = useRef(initialValue);
  const subscribersRef = useRef<Array<() => void>>([]);
  
  const getConfigs = useCallback(() => {
    return valueRef.current;
  }, []);

  const setConfigs = useCallback((newValue: any, shouldNotify = false) => {
    valueRef.current = newValue;
    
    // 仅在明确要求通知时执行回调
    if (shouldNotify) {
      subscribersRef.current.forEach(callback => callback());
    }
  }, []);
  
  const getFiltersConfigs = useCallback(() => {
    return valueRef.current?.configData?.filterSteps || {};
  }, []);
  
  const getEventsConfigs = useCallback(() => {
    return valueRef.current?.configData?.events || {};
  }, []);

  const subscribe = useCallback((callback: () => void) => {
    subscribersRef.current.push(callback);
    
    // 返回取消订阅函数
    return () => {
      subscribersRef.current = subscribersRef.current.filter(cb => cb !== callback);
    };
  }, []);

  const contextValue = useRef({
    getConfigs,
    setConfigs,
    getFiltersConfigs,
    getEventsConfigs,
    subscribe
  }).current;

  return (
    <BlockConfigsContext.Provider value={contextValue}>
      {children}
    </BlockConfigsContext.Provider>
  );
}; 