import { useMemo } from 'react';
import { useFlowEngine } from '../provider';
import { useApp } from '@nocobase/client';
import { FlowContext } from '../types';

export function useContext(): FlowContext {
  const engine = useFlowEngine();
  const app = useApp();
  
  // 创建并返回上下文对象
  const context = useMemo(() => ({
    engine,
    app,
  } as FlowContext), [engine, app]);
  
  return context;
} 