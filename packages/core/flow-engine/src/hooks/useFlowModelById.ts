/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useMemo } from 'react';
import { FlowModel } from '../models';
// import { useApp } from '@nocobase/client'; // 移除 useApp
import { useFlowEngine } from '../provider';
import { StepParams } from '../types';

export function useFlowModelById<T extends FlowModel = FlowModel>(
  uid: string,
  modelClassName?: string,
  stepParams?: StepParams,
): T {
  const engine = useFlowEngine();
  // const app = useApp(); // 移除 app

  const model = useMemo(() => {
    let instance = engine.getModel<T>(uid);
    if (!instance && modelClassName) {
      instance = engine.createModel<T>({
        uid,
        use: modelClassName,
        stepParams,
        // app: app, // createModel 的 app 参数已被移除
      });
    }
    return instance;
  }, [engine, /* app, */ modelClassName, uid, stepParams]); // 移除 app 从依赖数组

  return model;
}
