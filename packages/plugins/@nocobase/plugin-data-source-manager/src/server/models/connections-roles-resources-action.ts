/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ACL, ACLRole, type RoleActionParams } from '@nocobase/acl';
import { Model } from '@nocobase/database';

interface ScopeRecordLike {
  get: (key: string) => unknown;
}

interface ScopeAssociation {
  getScope: (options: { transaction?: unknown }) => Promise<ScopeRecordLike | null | undefined>;
}

export class DataSourcesRolesResourcesActionModel extends Model {
  async writeToACL(options: { acl: ACL; role: ACLRole; resourceName: string; transaction?: unknown }) {
    const { resourceName, role, transaction } = options;
    const actionName = this.get('name') as string;
    const fields = this.get('fields');
    const actionPath = `${resourceName}:${actionName}`;
    const actionParams: RoleActionParams = {
      fields: Array.isArray(fields) ? fields.filter((field): field is string => typeof field === 'string') : undefined,
    };

    const scope = await (this as unknown as ScopeAssociation).getScope({ transaction });

    if (scope) {
      actionParams.own = scope.get('key') === 'own';
      actionParams.filter = scope.get('scope');
    }

    role.grantAction(actionPath, actionParams);
  }
}
