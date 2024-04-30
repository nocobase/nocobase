/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ACL } from '@nocobase/acl';
import { availableActions } from './available-action';

export function createACL() {
  const acl = new ACL();

  for (const [actionName, actionParams] of Object.entries(availableActions)) {
    acl.setAvailableAction(actionName, actionParams);
  }

  return acl;
}
