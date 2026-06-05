/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This program is offered under a commercial license.
 * For more information, see <https://www.nocobase.com/agreement>
 */

import { tval } from '@nocobase/utils/client';
import { useTranslation as useT } from 'react-i18next';

export const NAMESPACE = 'comments';

export function generateNTemplate(key: string) {
  return tval(key, { ns: NAMESPACE })
}

export function useTranslation() {
  return useT(NAMESPACE);
}
