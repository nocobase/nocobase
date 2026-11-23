/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Filter, Repository } from '@nocobase/database';
import { isPlainObject, isValidFilter } from '@nocobase/utils';

function isRecipientFilter(value: unknown): value is { filter: Filter } {
  if (!value || typeof value !== 'object' || !('filter' in value)) {
    return false;
  }
  return (
    isPlainObject(value) &&
    Object.keys(value).length === 1 &&
    isPlainObject(value.filter) &&
    isValidFilter(value.filter)
  );
}

export async function parseUserSelectionConfig(
  userSelectionConfig: unknown[],
  userRepo: Repository,
): Promise<string[]> {
  const users = new Set<string>();
  for (const item of userSelectionConfig.flat().filter(Boolean)) {
    if (typeof item === 'string' || typeof item === 'number') {
      users.add(String(item));
      continue;
    }
    if (!isRecipientFilter(item)) {
      throw new Error('Invalid notification recipient. Select a user ID or configure a user filter.');
    }
    const matches = await userRepo.find({ filter: item.filter, fields: ['id'] });
    matches.forEach((user) => users.add(String(user.id)));
  }

  return [...users];
}
