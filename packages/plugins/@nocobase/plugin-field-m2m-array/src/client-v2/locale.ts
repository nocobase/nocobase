/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { tExpr as _tExpr, useFlowEngine } from '@nocobase/flow-engine';

const PACKAGE_NAME = '@nocobase/plugin-field-m2m-array';

export function useT() {
  const engine = useFlowEngine();
  return (str: string, options = {}) => engine.context.t(str, { ...options, ns: [PACKAGE_NAME, 'client'] });
}

export function tExpr(key: string) {
  return _tExpr(key, { ns: [PACKAGE_NAME, 'client'] });
}
