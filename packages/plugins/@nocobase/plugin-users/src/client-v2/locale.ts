/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useTranslation } from 'react-i18next';

export const NAMESPACE = 'users';

// Locale resources auto-loaded by v2 buildin `LocalePlugin.afterAdd`.

export function useUsersTranslation() {
  return useTranslation([NAMESPACE, 'client'], { nsMode: 'fallback' });
}
