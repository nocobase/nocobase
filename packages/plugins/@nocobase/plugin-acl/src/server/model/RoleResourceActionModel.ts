/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ACL, ACLRole } from '@nocobase/acl';
import { Model, transaction } from '@nocobase/database';

export class RoleResourceActionModel extends Model {
  async writeToACL(options: { acl: ACL; role: ACLRole; resourceName: string; transaction?: any }) {
    const { resourceName, role, transaction } = options;

    const actionName = this.get('name') as string;

    const fields = this.get('fields') as any;

    const actionPath = `${resourceName}:${actionName}`;
    const actionParams = {
      fields,
    };

    const scope = await this.getScope({ transaction });

    if (scope) {
      actionParams['own'] = scope.get('key') === 'own';
      actionParams['filter'] = scope.get('scope');
    }

    role.grantAction(actionPath, actionParams);
  }
}
