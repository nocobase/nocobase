import { ACL, ACLResource, ACLRole } from '@nocobase/acl';
import { Model } from '@nocobase/database';
import { AssociationFieldsActions, GrantHelper } from '../server';
import { RoleResourceActionModel } from './RoleResourceActionModel';

export class RoleResourceModel extends Model {
  async revoke(options: { role: ACLRole; resourceName: string; grantHelper: GrantHelper }) {
    const { role, resourceName, grantHelper } = options;
    role.revokeResource(resourceName);

    const targetActions = grantHelper.resourceTargetActionMap.get(`${role.name}.${resourceName}`) || [];

    for (const targetAction of targetActions) {
      const targetActionResource = (grantHelper.targetActionResourceMap.get(targetAction) || []).filter(
        (item) => `${role.name}.${resourceName}` !== item,
      );

      grantHelper.targetActionResourceMap.set(targetAction, targetActionResource);

      if (targetActionResource.length == 0) {
        role.revokeAction(targetAction);
      }
    }

    grantHelper.resourceTargetActionMap.set(`${role.name}.${resourceName}`, []);
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

    if (!role) {
      console.log(`${roleName} role does not exist`);
      return;
    }

    // revoke resource of role
    await this.revoke({ role, resourceName, grantHelper });

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
