/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database, Model } from '@nocobase/database';

const DEFAULT_ROLE_NAMES_WITH_NEW_MULTI_PORTAL_ACCESS = ['admin', 'member'] as const;
type DefaultRoleNameWithNewMultiPortalAccess = (typeof DEFAULT_ROLE_NAMES_WITH_NEW_MULTI_PORTAL_ACCESS)[number];

function isDefaultRoleNameWithNewMultiPortalAccess(value: unknown): value is DefaultRoleNameWithNewMultiPortalAccess {
  return (
    typeof value === 'string' && (DEFAULT_ROLE_NAMES_WITH_NEW_MULTI_PORTAL_ACCESS as readonly string[]).includes(value)
  );
}

export function applyDefaultRoleMultiPortalAccess(role: Model) {
  if (role.get('allowNewMultiPortal') == null && isDefaultRoleNameWithNewMultiPortalAccess(role.get('name'))) {
    role.set('allowNewMultiPortal', true);
  }
}

export async function ensureDefaultRoleMultiPortalAccess(db: Database) {
  const rolesCollection = db.getCollection('roles');
  if (!rolesCollection?.getField('allowNewMultiPortal')) {
    return;
  }

  const repository = db.getRepository('roles');
  const roles = await repository.find({
    filter: {
      name: [...DEFAULT_ROLE_NAMES_WITH_NEW_MULTI_PORTAL_ACCESS],
    },
    fields: ['name', 'allowNewMultiPortal'],
  });

  for (const role of roles) {
    if (role.get('allowNewMultiPortal') != null) {
      continue;
    }

    await repository.update({
      filterByTk: role.get('name'),
      values: {
        allowNewMultiPortal: true,
      },
    });
  }
}
