/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFlowEngine } from '@nocobase/flow-engine';
import { useTranslation } from 'react-i18next';

export const NAMESPACE = 'auth-sms';

export function useAuthSMSTranslation() {
  return useTranslation([NAMESPACE, 'client'], { nsMode: 'fallback' });
}

/**
 * v2-style translator. Routes through `flowEngine.context.t`, which natively
 * expands legacy `{{t("…")}}` Schema templates and falls back to the `client`
 * namespace if a key is not defined in `auth-sms`.
 */
export function useT() {
  const engine = useFlowEngine();
  return (key: string) => engine.context.t(key, { ns: [NAMESPACE, 'client'], nsMode: 'fallback' });
}
