/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { tExpr as flowTExpr, useFlowEngine } from '@nocobase/flow-engine';
import { useTranslation } from 'react-i18next';

export const NAMESPACE = 'notification-in-app-message';
const PACKAGE_NAME = '@nocobase/plugin-notification-in-app-message';

export function useInAppMessageTranslation() {
  return useTranslation([NAMESPACE, PACKAGE_NAME, 'client'], {
    nsMode: 'fallback',
  });
}

export function useT() {
  const engine = useFlowEngine();
  return (key: string, options?: Record<string, any>) =>
    engine.context.t(key, { ns: [NAMESPACE, PACKAGE_NAME, 'client'], nsMode: 'fallback', ...options });
}

export function tExpr(key: string) {
  return flowTExpr(key, { ns: [NAMESPACE, PACKAGE_NAME, 'client'] });
}
