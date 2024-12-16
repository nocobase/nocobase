/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useTranslation } from 'react-i18next';
import { i18n } from '@nocobase/client';

export const NAMESPACE = 'auth';

export function useAuthTranslation() {
  return useTranslation([NAMESPACE, 'client'], { nsMode: 'fallback' });
}

export function lang(key: string) {
  return i18n.t(key, { ns: [NAMESPACE, 'client'], nsMode: 'fallback' });
}
