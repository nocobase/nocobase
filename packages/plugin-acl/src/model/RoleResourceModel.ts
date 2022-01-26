import { Database, Model } from '@nocobase/database';
import { ACL } from '@nocobase/acl';
import { RoleResourceActionModel } from './RoleResourceActionModel';
import { AssociationFieldsActions } from '../server';

export class RoleResourceModel extends Model {
  async writeToACL(options: { acl: ACL; associationFieldsActions: AssociationFieldsActions; transaction: any }) {
    const { acl, associationFieldsActions } = options;
    const resourceName = this.get('name') as string;
    const roleName = this.get('roleName') as string;
    const role = acl.getRole(roleName);

    role.revokeResource(resourceName);

    // @ts-ignore
    const actions: RoleResourceActionModel[] = await this.getActions({
      transaction: options.transaction,
    });

    for (const action of actions) {
      await action.writeToAcl({
        acl,
        role,
        resourceName,
        associationFieldsActions,
      });
    }
  }
}
