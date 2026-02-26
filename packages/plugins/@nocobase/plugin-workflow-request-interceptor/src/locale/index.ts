/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This program is offered under a commercial license.
 * For more information, see <https://www.nocobase.com/agreement>
 */

import { i18n } from '@nocobase/client';

export const NAMESPACE = '@nocobase/plugin-workflow-request-interceptor';

export function lang(key: string, options = {}) {
  return i18n.t(key, { ...options, ns: NAMESPACE });
}
