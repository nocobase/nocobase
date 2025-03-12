/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Repository } from '@nocobase/database';
import { isValidFilter } from '@nocobase/utils';
export async function parseUserSelectionConf(
  userSelectionConfig: Array<Record<any, any> | string>,
  UserRepo: Repository,
) {
  const SelectionConfigs = userSelectionConfig.flat().filter(Boolean);
  const users = new Set<string>();
  for (const item of SelectionConfigs) {
    if (typeof item === 'object') {
      if (!isValidFilter(item.filter)) {
        continue;
      }
      const result = await UserRepo.find({
        ...item,
        fields: ['id'],
      });
      result.forEach((item) => users.add(item.id));
    } else {
      users.add(item);
    }
  }

  return [...users];
}
