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

export const NAMESPACE = 'auth';

// Locale resources auto-loaded by v2 buildin `LocalePlugin.afterAdd`.

export function useAuthTranslation() {
  return useTranslation([NAMESPACE, 'client'], { nsMode: 'fallback' });
}

/**
 * v2-style translator. Routes through `flowEngine.context.t`, which natively
 * expands legacy Formily Schema templates (e.g. `{{t("Nickname")}}`) via its
 * own `compileTemplate` pass. Use this anywhere a raw value coming from the
 * server may contain a `{{t("…")}}` wrapper — it avoids pulling in
 * `@formily/react`'s `Schema.compile` for that single concern.
 */
export function useT() {
  const engine = useFlowEngine();
  return (key: string) => engine.context.t(key, { ns: [NAMESPACE, 'client'], nsMode: 'fallback' });
}
