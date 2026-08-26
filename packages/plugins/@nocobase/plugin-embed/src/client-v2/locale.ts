/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { tExpr as _tExpr } from '@nocobase/flow-engine';
import { useTranslation as useT } from 'react-i18next';

export const NAMESPACE = '@nocobase/plugin-embed';

export function tExpr(key: string) {
  return _tExpr(key, { ns: NAMESPACE });
}

export function useTranslation() {
  return useT(NAMESPACE, {
    nsMode: 'fallback',
  });
}
