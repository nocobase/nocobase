import { useMemo } from 'react';
import { FlowModel, useApp } from '@nocobase/client';
import { useFlowEngine } from '../provider';

export function useFlowModel<T extends FlowModel = FlowModel>(
  uid: string,
  modelClassName?: string,
  stepsParams?: Record<string, any>,
): T {
  const engine = useFlowEngine();
  const app = useApp();

  const model = useMemo(() => {
    let instance = engine.getModel<T>(uid);
    if (!instance && modelClassName) {
      instance = engine.createModel<T>({
        uid,
        use: modelClassName,
        stepsParams
      });
    }
    return instance;
  }, [engine, app, modelClassName, uid, stepsParams]);
  
  return model;
} 