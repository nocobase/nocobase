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

export const NAMESPACE = '@nocobase/plugin-data-visualization-echarts';

export function tExpr(key: string) {
  return _tExpr(key, { ns: [NAMESPACE, '@nocobase/plugin-data-visualization', 'client'] });
}

export function useEChartsTranslation() {
  return useTranslation([NAMESPACE, '@nocobase/plugin-data-visualization', 'client'], {
    nsMode: 'fallback',
  });
}
