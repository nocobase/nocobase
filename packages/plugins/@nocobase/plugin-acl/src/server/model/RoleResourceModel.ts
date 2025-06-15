/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ACL, ACLResource, ACLRole } from '@nocobase/acl';
import { Model } from '@nocobase/database';
import { RoleResourceActionModel } from './RoleResourceActionModel';

export class RoleResourceModel extends Model {
  async revoke(options: { role: ACLRole; resourceName: string }) {
    const { role, resourceName } = options;
    role.revokeResource(resourceName);
  }

  async writeToACL(options: { acl: ACL; transaction?: any }) {
    const { acl, transaction } = options;
    const resourceName = this.get('name') as string;
    const roleName = this.get('roleName') as string;
    const role = acl.getRole(roleName);

    if (!role) {
      console.log(`${roleName} role does not exist`);
      return;
    }

    // revoke resource of role
    await this.revoke({ role, resourceName });

    // @ts-ignore
    if (this.usingActionsConfig === false) {
      return;
    }

    const resource = new ACLResource({
      role,
      name: resourceName,
    });

    role.resources.set(resourceName, resource);

    // @ts-ignore
    const actions: RoleResourceActionModel[] = await this.getActions({
      transaction,
    });

    for (const action of actions) {
      await action.writeToACL({
        acl,
        role,
        resourceName,
        transaction,
      });
    }
  }
}
