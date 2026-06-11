/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { tExpr as _tExpr, useFlowEngine } from '@nocobase/flow-engine';

export const NAMESPACE = 'theme-editor';
export const THEME_EDITOR_ACL = 'pm.theme-editor.themes';

export function useT() {
  const engine = useFlowEngine();
  return (str: string, options?: Record<string, any>) =>
    engine.context.t(str, { ns: [NAMESPACE, 'client'], ...options });
}

export function tExpr(key: string, options?: Record<string, any>) {
  return _tExpr(key, { ns: NAMESPACE, ...options });
}

export function translateThemeEditor(ctx: { t: (key: string, options?: Record<string, any>) => string }, key: string) {
  return ctx.t(key, { ns: [NAMESPACE, 'client'] });
}
