/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { tExpr as _tExpr } from '@nocobase/flow-engine';
import { useTranslation as useI18nTranslation } from 'react-i18next';
import { PUBLIC_FORMS_NAMESPACE } from './constants';

export const NAMESPACE = PUBLIC_FORMS_NAMESPACE;

export function tExpr(key: string) {
  return _tExpr(key, { ns: NAMESPACE });
}

export function useT() {
  const { t } = useI18nTranslation([NAMESPACE, 'client'], {
    nsMode: 'fallback',
  });
  return t;
}

export function usePublicFormTranslation() {
  return useI18nTranslation([NAMESPACE, 'client'], {
    nsMode: 'fallback',
  });
}
