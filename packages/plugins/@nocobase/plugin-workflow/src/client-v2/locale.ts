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

/**
 * The standard react-i18next hook, scoped to the workflow namespace with a
 * `client` fallback. Returns the full `{ t, i18n, ... }` object.
 *
 * Use this when you need react-i18next features beyond a plain string lookup:
 *  - the `<Trans>` component (composite/JSX keys like "Meet <1>…</1> conditions
 *    in the group"), which needs a react-i18next `t` via its `t=` prop;
 *  - the `i18n` instance itself (current language, `changeLanguage`, etc.);
 *  - parity with v1 code being ported, which used `useTranslation()`.
 *
 * Its `t` does a **plain key lookup** — it does NOT expand `{{t("…")}}` template
 * strings. For those, use {@link useT}.
 */
export function useWorkflowTranslation() {
  // Fall back to the core `client` namespace so generic UI strings (Title, Edit, Add new, Filter, …) resolve without
  // re-declaring them here.
  return useTranslation([NAMESPACE, 'client'], { nsMode: 'fallback' });
}

/**
 * The FlowEngine translator (`flowEngine.context.t`), scoped to the workflow
 * namespace with a `client` fallback. Returns a bare `t(key, options?)` function
 * — the default choice for translating a single string in canvas / FlowModel UI.
 *
 * The key difference from {@link useWorkflowTranslation}'s `t`: this one also
 * **expands `{{t("…")}}` template strings**. Instruction/trigger metadata
 * (`title`, `description`, field labels) is authored as `{{t("Foo", { ns })}}`
 * templates, and `useT()('{{t("Foo")}}')` compiles them to the translation —
 * a plain react-i18next `t` would return the literal template unchanged. It of
 * course also handles plain keys (`useT()('Submit')`), so it covers both cases.
 *
 * Rule of thumb: reach for `useT` by default; switch to `useWorkflowTranslation`
 * only when you specifically need `<Trans>` or the `i18n` instance.
 */
export function useT() {
  const flowEngine = useFlowEngine();
  return (key: string, options?: Record<string, any>) =>
    flowEngine.context.t(key, { ns: [NAMESPACE, 'client'], nsMode: 'fallback', ...options });
}
