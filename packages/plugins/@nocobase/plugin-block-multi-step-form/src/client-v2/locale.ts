/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { tExpr as _tExpr } from '@nocobase/flow-engine';
import { useTranslation } from 'react-i18next';

export const NAMESPACE = '@nocobase/plugin-block-multi-step-form';

export function tExpr(key: string) {
  return _tExpr(key, { ns: [NAMESPACE, 'client'] });
}

export function useStepsFormTranslation() {
  return useTranslation([NAMESPACE, 'client'], {
    nsMode: 'fallback',
  });
}
