import { Database, Model } from '@nocobase/database';
import { ACL, ACLRole } from '@nocobase/acl';
import { RoleResourceActionModel } from './RoleResourceActionModel';
import { AssociationFieldsActions, GrantHelper } from '../server';

export class RoleResourceModel extends Model {
  async revoke(options: { role: ACLRole; resourceName: string; grantHelper: GrantHelper }) {
    const { role, resourceName, grantHelper } = options;
    role.revokeResource(resourceName);

    const targetActions = grantHelper.resourceTargetActionMap.get(resourceName) || [];

    for (const targetAction of targetActions) {
      const targetActionResource = (grantHelper.targetActionResourceMap.get(targetAction) || []).filter(
        (item) => resourceName !== item,
      );

      grantHelper.targetActionResourceMap.set(targetAction, targetActionResource);
      if (targetActionResource.length == 0) {
        role.revokeAction(targetAction);
      }
    }

    grantHelper.resourceTargetActionMap.set(resourceName, []);
  }

  async writeToACL(options: {
    acl: ACL;
    associationFieldsActions: AssociationFieldsActions;
    grantHelper: GrantHelper;
    transaction: any;
  }) {
    const { acl, associationFieldsActions, grantHelper } = options;
    const resourceName = this.get('name') as string;
    const roleName = this.get('roleName') as string;
    const role = acl.getRole(roleName);

    // revoke resource of role
    await this.revoke({ role, resourceName, grantHelper });

    // @ts-ignore
    if (this.usingActionsConfig === false) {
      return;
    }

    // @ts-ignore
    const actions: RoleResourceActionModel[] = await this.getActions({
      transaction: options.transaction,
    });

    for (const action of actions) {
      await action.writeToACL({
        acl,
        role,
        resourceName,
        associationFieldsActions,
        grantHelper: options.grantHelper,
      });
    }
  }
}
