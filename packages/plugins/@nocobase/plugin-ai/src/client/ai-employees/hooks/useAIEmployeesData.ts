/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFlowEngine } from '@nocobase/flow-engine';
import { AIEmployee } from '../types';
import { useRequest } from '@nocobase/client';
import { create } from 'zustand';
import { createSelectors } from '../chatbox/stores/create-selectors';
import { useEffect } from 'react';

const store = create<{
  signal: boolean;
  sendSignal: () => void;
}>()((set) => ({
  signal: false,
  sendSignal: () => set((state) => ({ signal: !state.signal })),
}));
const useSignal = createSelectors(store);

export const useAIEmployeesData = () => {
  const flowEngine = useFlowEngine();
  const signal = useSignal.use.signal();
  const sendSignal = useSignal.use.sendSignal();

  const { loading, data, refreshAsync } = useRequest<{
    aiEmployees: AIEmployee[];
    aiEmployeesMap: {
      [username: string]: AIEmployee;
    };
  }>(() => flowEngine.context.aiEmployeesData);
  const aiEmployees = data?.aiEmployees || [];
  const aiEmployeesMap = data?.aiEmployeesMap || {};

  // AI员工管理页修改了数据后，ChatButton不会重新渲染
  // ChatButton所在父组件通过app.use注册，被useMemo包裹而且依赖是app，所以在父组件之外的hooks调用都不会触发ChatButton渲染
  // refresh方法被admin下的组件调用，admin并不和ChatButton在同一个组件树下。这时是没办法触发ChatButton渲染的，所以利用zustand来触发
  useEffect(() => {
    refreshAsync();
  }, [signal, refreshAsync]);

  return {
    loading,
    aiEmployees,
    aiEmployeesMap,
    refresh: () => {
      flowEngine.context.removeCache('aiEmployeesData');
      sendSignal();
    },
  };
};
