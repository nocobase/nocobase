/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { tExpr as _tExpr, useFlowEngine } from '@nocobase/flow-engine';
import { useTranslation } from 'react-i18next';
import { NAMESPACE } from '../common/constants';

export { NAMESPACE };

export function tExpr(key: string, options?: Record<string, any>) {
  return _tExpr(key, { ns: NAMESPACE, ...options });
}

export function useWorkflowTranslation() {
  // Fall back to the core `client` namespace so generic UI strings (Title,
  // Edit, Add new, Filter, …) resolve without re-declaring them here.
  return useTranslation([NAMESPACE, 'client'], { nsMode: 'fallback' });
}

export function useT() {
  const flowEngine = useFlowEngine();
  return (key: string, options?: Record<string, any>) =>
    flowEngine.context.t(key, { ns: [NAMESPACE, 'client'], nsMode: 'fallback', ...options });
}
