import { useMemo } from 'react';
import { FlowModel, useApp } from '@nocobase/client';
import { useFlowEngine } from '../provider';

export function useModelById<T extends FlowModel = FlowModel>(
  uid: string,
  modelClassName?: string,
): T {
  const engine = useFlowEngine();
  const app = useApp();

  const model = useMemo(() => {
    let instance = engine.getModel<T>(uid);
    if (!instance && modelClassName) {
      instance = engine.createModel<T>(uid, modelClassName, app);
    }
    return instance;
  }, [engine, app, modelClassName, uid]);
  
  return model;
} 