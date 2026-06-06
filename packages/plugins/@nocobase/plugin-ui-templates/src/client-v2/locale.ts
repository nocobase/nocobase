/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { tExpr, useFlowEngine, type FlowModel } from '@nocobase/flow-engine';
import { useCallback } from 'react';

export const NAMESPACE = '@nocobase/plugin-ui-templates';

type TranslationOptions = Record<string, unknown>;

export function useT() {
  const engine = useFlowEngine();
  return useCallback(
    (str: string, options?: TranslationOptions) =>
      engine.context.t(str, { ns: [NAMESPACE, 'client'], nsMode: 'fallback', ...(options || {}) }),
    [engine],
  );
}

export function tStr(key: string) {
  return tExpr(key, { ns: [NAMESPACE, 'client'], nsMode: 'fallback' });
}

/**
 * 获取带有插件命名空间的翻译函数（用于非组件环境）
 * @param model FlowModel 实例
 * @returns 翻译函数，使用插件命名空间
 */
export function getPluginT(model: FlowModel): (key: string, options?: TranslationOptions) => string {
  if (model.flowEngine?.translate) {
    return (key: string, options?: TranslationOptions) => {
      return model.flowEngine.translate(key, { ns: [NAMESPACE, 'client'], nsMode: 'fallback', ...options });
    };
  }
  // 回退到原始键值
  return (key: string) => key;
}
