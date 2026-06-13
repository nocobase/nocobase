/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database, Model } from '@nocobase/database';

const DEFAULT_ROLE_NAMES_WITH_NEW_UI_LAYOUT_ACCESS = ['admin', 'member'] as const;
type DefaultRoleNameWithNewUiLayoutAccess = (typeof DEFAULT_ROLE_NAMES_WITH_NEW_UI_LAYOUT_ACCESS)[number];

function isDefaultRoleNameWithNewUiLayoutAccess(value: unknown): value is DefaultRoleNameWithNewUiLayoutAccess {
  return (
    typeof value === 'string' && (DEFAULT_ROLE_NAMES_WITH_NEW_UI_LAYOUT_ACCESS as readonly string[]).includes(value)
  );
}

export function applyDefaultRoleUiLayoutAccess(role: Model) {
  if (role.get('allowNewUiLayout') == null && isDefaultRoleNameWithNewUiLayoutAccess(role.get('name'))) {
    role.set('allowNewUiLayout', true);
  }
}

export async function ensureDefaultRoleUiLayoutAccess(db: Database) {
  const rolesCollection = db.getCollection('roles');
  if (!rolesCollection?.getField('allowNewUiLayout')) {
    return;
  }

  const repository = db.getRepository('roles');
  const roles = await repository.find({
    filter: {
      name: [...DEFAULT_ROLE_NAMES_WITH_NEW_UI_LAYOUT_ACCESS],
    },
    fields: ['name', 'allowNewUiLayout'],
  });

  for (const role of roles) {
    if (role.get('allowNewUiLayout') != null) {
      continue;
    }

    await repository.update({
      filterByTk: role.get('name'),
      values: {
        allowNewUiLayout: true,
      },
    });
  }
}
